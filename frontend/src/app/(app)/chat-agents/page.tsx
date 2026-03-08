'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
    ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState,
    addEdge, Panel, ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    BotMessageSquare, Play, Settings, Plus, LayoutGrid, Brain, Save, ChevronRight, Activity, GitBranch, ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

// Import our custom OpenClaw node designs
import { TriggerNode, ReasoningNode, ConditionNode, ToolNode, EscalationNode } from '@/components/FlowNodes';

// Define Node Types registry
const nodeTypes = {
    trigger: TriggerNode,
    reasoning: ReasoningNode,
    condition: ConditionNode,
    tool: ToolNode,
    escalation: EscalationNode
};

// ── Mock Template Canvas State (Sales Qualification Bot) ──
const initialNodes = [
    {
        id: 'start',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { label: 'New Telegram Message' }
    },
    {
        id: 'intent',
        type: 'reasoning',
        position: { x: 220, y: 150 },
        data: { agentName: 'QualifierBot', instruction: 'Analyze message intent. Extract budget if mentioned. Predict next action based on sales playbook.' }
    },
    {
        id: 'cond_1',
        type: 'condition',
        position: { x: 240, y: 350 },
        data: { condition: 'Intent == "Pricing"' }
    },
    {
        id: 'action_quote',
        type: 'tool',
        position: { x: 50, y: 500 },
        data: { toolName: 'amocrm.draft_proposal', payload: { type: 'enterprise', target: 'Context.LeadId' } }
    },
    {
        id: 'escalate',
        type: 'escalation',
        position: { x: 400, y: 500 },
        data: { reason: 'Lead requires custom negotiation.' }
    }
];

const initialEdges = [
    { id: 'e1', source: 'start', target: 'intent', animated: true, style: { stroke: 'var(--accent)', strokeWidth: 2 } },
    { id: 'e2', source: 'intent', target: 'cond_1', type: 'smoothstep', style: { strokeWidth: 2 } },
    { id: 'e3', source: 'cond_1', sourceHandle: 'true', target: 'action_quote', type: 'smoothstep', style: { stroke: 'var(--success)', strokeWidth: 2 } },
    { id: 'e4', source: 'cond_1', sourceHandle: 'false', target: 'escalate', type: 'smoothstep', style: { stroke: 'var(--danger)', strokeWidth: 2 } }
];

function FlowBuilder() {
    const { t } = useLanguage();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeClick = (event: any, node: any) => {
        setSelectedNode(node);
    };

    const addNode = (type: string) => {
        const id = `${type}_${Date.now()}`;
        const newNode = {
            id,
            type,
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: getInitialDataForType(type)
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNodes((nds) => nds.concat(newNode as any));
    };

    const getInitialDataForType = (type: string) => {
        switch (type) {
            case 'trigger': return { label: 'New Incoming Event' };
            case 'reasoning': return { agentName: 'AI Agent', instruction: 'Analyze context and decide what to do.' };
            case 'condition': return { condition: 'Variable == True' };
            case 'tool': return { toolName: 'system.example_tool', payload: {} };
            case 'escalation': return { reason: 'Requires human review.' };
            default: return {};
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>

            {/* LEFT TOOLBOX */}
            <div style={{ width: 280, background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LayoutGrid size={18} color="var(--accent)" /> Nodes Library
                    </h2>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                    <div className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: '1px dashed var(--purple)' }} onClick={() => addNode('trigger')}>
                        + Trigger Node
                    </div>
                    <div className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: '1px dashed var(--accent)' }} onClick={() => addNode('reasoning')}>
                        + Agent Reasoning
                    </div>
                    <div className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: '1px dashed var(--warning)' }} onClick={() => addNode('condition')}>
                        + Condition Logic
                    </div>
                    <div className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: '1px dashed var(--border)' }} onClick={() => addNode('tool')}>
                        + Execute Tool Action
                    </div>
                    <div className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: '1px dashed var(--danger)', color: 'var(--danger)' }} onClick={() => addNode('escalation')}>
                        + Human Escalation
                    </div>
                </div>

                {/* Execution Visibility Helper */}
                <div style={{ padding: 20, marginTop: 'auto', borderTop: '1px solid var(--border)', background: 'rgba(59, 130, 246, 0.05)' }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={14} /> Live Tracing active
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        When simulating, the execution timeline will trace the AI's reasoning path via pulsing edges.
                    </p>
                </div>
            </div>

            {/* CENTER CANVAS */}
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.2}
                >
                    <Background color="var(--border)" gap={24} size={2} />
                    <Controls style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fill: 'var(--text-primary)' }} />
                    <MiniMap
                        nodeStrokeColor="var(--border)"
                        nodeColor="var(--bg-card)"
                        maskColor="rgba(0,0,0,0.8)"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    />

                    <Panel position="top-right" style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary">Discard</button>
                        <button className="btn btn-primary" style={{ gap: 8 }}><Save size={14} /> Save Blueprint</button>
                    </Panel>

                    {/* EXECUTION TIMELINE OVERLAY */}
                    <Panel position="bottom-center" style={{ width: '80%', maxWidth: 800, marginBottom: 20 }}>
                        <div className="card" style={{ padding: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                                    <Activity size={14} color="var(--success)" /> Live Execution Trace
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Session: TG-88942</span>
                            </div>
                            <div style={{ display: 'flex', gap: 2, padding: 12, overflowX: 'auto' }}>
                                {[
                                    { t: '14:02:01', n: 'Trigger', ok: true },
                                    { t: '14:02:02', n: 'Agent Reasoning', ok: true },
                                    { t: '14:02:04', n: 'Condition: Pricing', ok: true },
                                    { t: '14:02:05', n: 'amocrm.draft_proposal', ok: true, active: true },
                                    { t: 'Pending', n: 'HITL Approval', ok: false },
                                ].map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div style={{
                                            padding: '8px 12px', borderRadius: 8, flexShrink: 0,
                                            background: step.active ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)',
                                            border: `1px solid ${step.active ? 'var(--accent)' : 'var(--border)'}`
                                        }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{step.t}</div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: step.active ? 'var(--accent)' : 'var(--text-primary)' }}>{step.n}</div>
                                        </div>
                                        {i < 4 && <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', padding: '0 4px' }}><ArrowRight size={14} /></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>

            {/* RIGHT INSPECTOR PANEL */}
            {selectedNode && (
                <div style={{ width: 320, background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node Inspector</h2>
                        <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSelectedNode(null)}>✕</button>
                    </div>
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Node ID</label>
                            <input className="input" disabled value={selectedNode.id} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                        </div>

                        {selectedNode.type === 'reasoning' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Assigned Agent</label>
                                    <select className="input" defaultValue={selectedNode.data.agentName}>
                                        <option>QualifierBot</option>
                                        <option>Support_BotX</option>
                                        <option>Enterprise_Closer</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Prompt Instruction</label>
                                    <textarea className="input" rows={6} defaultValue={selectedNode.data.instruction} style={{ fontSize: 13, lineHeight: 1.5 }} />
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'tool' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Target Tool API</label>
                                    <select className="input" defaultValue={selectedNode.data.toolName}>
                                        <option>amocrm.draft_proposal</option>
                                        <option>amocrm.update_lead</option>
                                        <option>telegram.send_document</option>
                                        <option>calendar.schedule_meeting</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Payload Mapping (JSON)</label>
                                    <textarea className="input" rows={8} defaultValue={JSON.stringify(selectedNode.data.payload, null, 2)} style={{ fontFamily: 'monospace', fontSize: 12 }} />
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'condition' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Logic Evaluation</label>
                                <input className="input" defaultValue={selectedNode.data.condition} style={{ fontFamily: 'monospace', fontSize: 13 }} />
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Use variables from previous Reasoning nodes (e.g., `Intent == "Support"`).</p>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}

export default function ChatAgentsPage() {
    return (
        <div className="page-container animate-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BotMessageSquare size={24} color="var(--accent)" /> Visual Automation Builder
                    <span className="badge info" style={{ fontSize: 10, alignSelf: 'center' }}>BETA</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                    Design OpenClaw-style autonomous logic spanning Trigger, Reasoning, Action Execution, and Branching schemas.
                </p>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                {/* Wrap in ReactFlowProvider to enable canvas contexts */}
                <ReactFlowProvider>
                    <FlowBuilder />
                </ReactFlowProvider>
            </div>
        </div>
    );
}
