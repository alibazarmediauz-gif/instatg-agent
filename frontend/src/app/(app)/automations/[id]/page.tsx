'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    OnConnect,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Plus, MessageCircle, Zap, Clock, Sparkles } from 'lucide-react';
import { customNodeTypes } from '@/components/automations/CustomNodes';

// Helper for generating new node IDs
let id = 0;
const getId = () => `dndnode_${id++}`;

export default function AutomationBuilder() {
    return (
        <ReactFlowProvider>
            <AutomationCanvas />
        </ReactFlowProvider>
    );
}

function AutomationCanvas() {
    const params = useParams();
    const router = useRouter();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    const initialNodes: Node[] = [
        {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 250, y: 150 },
            data: { keyword: 'start' },
        }
    ];
    const initialEdges: Edge[] = [];

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
    const [name, setName] = useState('Yangi Avtomatizatsiya');
    const [saving, setSaving] = useState(false);

    const onConnect: OnConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
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
            if (typeof type === 'undefined' || !type) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(),
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds: Node[]) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const flowData = reactFlowInstance.toObject();
            const payload = {
                name,
                is_active: true,
                trigger_type: 'keyword',
                trigger_keyword: 'start', // In a real app, read from Trigger node
                flow_data: flowData,
            };

            // Will connect to real API soon
            await new Promise(r => setTimeout(r, 1000));
            alert('Muvaffaqiyatli saqlandi!');
            router.push('/automations');
        } catch (e) {
            console.error(e);
            alert("Xatolik ro'y berdi.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            {/* Header */}
            <div style={{
                height: 64,
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => router.push('/automations')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: 18,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            outline: 'none',
                            width: 300
                        }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', fontSize: 13 }}>
                    {saving ? 'Saqlanmoqda...' : <><Save size={16} /> Saqlash yordamchi</>}
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{
                    width: 280,
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    zIndex: 10
                }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Qadamlar (Nodelar)</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                        Sichqoncha bilan tortib ekranga tashlang
                    </p>

                    <div
                        onDragStart={(event) => onDragStart(event, 'message')}
                        draggable
                        style={{ padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <MessageCircle size={18} color="#10B981" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Xabar Yuborish</span>
                    </div>

                    <div
                        onDragStart={(event) => onDragStart(event, 'aiStep')}
                        draggable
                        style={{ padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <Sparkles size={18} color="#8B5CF6" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>AI Javobi</span>
                    </div>

                    <div
                        onDragStart={(event) => onDragStart(event, 'delay')}
                        draggable
                        style={{ padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'grab', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <Clock size={18} color="#F59E0B" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Kutish (Delay)</span>
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={customNodeTypes}
                        fitView
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="#ccc" gap={16} />
                        <Controls />
                        <MiniMap
                            nodeStrokeColor={(n: Node) => {
                                if (n.type === 'trigger') return '#3B82F6';
                                if (n.type === 'message') return '#10B981';
                                if (n.type === 'aiStep') return '#8B5CF6';
                                if (n.type === 'delay') return '#F59E0B';
                                return '#eee';
                            }}
                            nodeColor={(n: Node) => {
                                return 'var(--bg-card)';
                            }}
                        />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
