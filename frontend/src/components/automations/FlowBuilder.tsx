import React, { useState, useCallback, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode, customNodeTypes } from './CustomNode';
import { Sidebar } from './Sidebar';
import { NodeProperties } from './NodeProperties';
import { apiClient } from '@/lib/api';

const nodeTypes = customNodeTypes;

const initialNodes: Node[] = [
    {
        id: 'trigger-1',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { nodeType: 'trigger', label: 'Instagram Keyword', content: 'If user sends message containing "narx" or "price"' },
    },
];

const initialEdges: Edge[] = [];

let id = 1;
const getId = () => `dndnode_${id++}`;

export const FlowBuilder = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const updateNodeData = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
    }, [setNodes]);

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type: 'customNode',
                position,
                data: {
                    nodeType: type,
                    label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    content: 'Configure this step...'
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data = await apiClient<any>('/api/automations', {
                method: 'POST',
                body: JSON.stringify({
                    name: `Workflow ${new Date().toLocaleTimeString()}`,
                    is_active: true,
                    trigger_type: 'visual_flow',
                    flow_data: { nodes, edges }
                })
            });
            if (data.status === 'success') {
                alert('Automation workflow saved successfully.');
            }
        } catch (err) {
            console.error('Failed to save automation:', err);
            alert('Failed to save automation workflow.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Visual Workflow Builder</h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Drag nodes from the sidebar onto the canvas to create your automation.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Automation'}
                </button>
            </div>

            <div style={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
                <div style={{ width: '240px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <Sidebar />
                </div>

                <div style={{ flexGrow: 1, position: 'relative', background: 'var(--bg-elevated)' }} ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                        minZoom={0.2}
                        maxZoom={2}
                    >
                        <Background color="var(--border)" gap={24} size={1} variant={'dots' as any} />
                        <Controls position="bottom-right" style={{ display: 'flex', gap: 4 }} />
                    </ReactFlow>
                </div>

                {selectedNodeId && (
                    <NodeProperties
                        node={selectedNode}
                        onUpdate={updateNodeData}
                        onClose={() => setSelectedNodeId(null)}
                    />
                )}
            </div>
        </div>
    );
};
