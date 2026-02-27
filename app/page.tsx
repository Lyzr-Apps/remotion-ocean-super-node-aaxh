'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  FiDownload,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiFilm,
  FiClock,
  FiLayers,
  FiImage,
  FiEdit3,
  FiCheck,
  FiX,
  FiFolder,
  FiHome,
  FiRefreshCw,
  FiZap,
  FiActivity,
  FiEye,
  FiArrowRight,
  FiLoader,
  FiAlertCircle,
  FiMonitor,
} from 'react-icons/fi'
import {
  HiOutlineSparkles,
  HiOutlineVideoCamera,
  HiOutlinePaintBrush,
  HiOutlineDocumentText,
  HiOutlineBeaker,
} from 'react-icons/hi2'

// ==================== THEME ====================
const THEME_VARS: React.CSSProperties & Record<string, string> = {
  '--background': '20 40% 4%',
  '--foreground': '30 30% 95%',
  '--card': '20 40% 6%',
  '--card-foreground': '30 30% 95%',
  '--primary': '30 30% 95%',
  '--primary-foreground': '20 40% 10%',
  '--secondary': '20 35% 12%',
  '--secondary-foreground': '30 30% 95%',
  '--accent': '24 80% 45%',
  '--accent-foreground': '30 30% 98%',
  '--muted': '20 30% 15%',
  '--muted-foreground': '30 20% 60%',
  '--border': '20 30% 15%',
  '--input': '20 30% 20%',
  '--ring': '24 80% 45%',
  '--destructive': '0 63% 31%',
  '--destructive-foreground': '30 30% 98%',
  '--radius': '1rem',
}

// ==================== TYPES ====================
interface SceneData {
  scene_number: number
  scene_title: string
  narration_text: string
  scene_description: string
  duration_seconds: number
  transition: string
}

interface ScriptData {
  title: string
  topic: string
  total_duration_seconds: number
  style: string
  research_summary: string
  scenes: SceneData[]
}

interface SceneVisual {
  scene_number: number
  image_prompt: string
  layout_description: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
  }
  motion_notes: string
  text_overlay: {
    text: string
    position: string
    animation: string
  }
}

interface VisualData {
  video_title: string
  visual_style: string
  scene_visuals: SceneVisual[]
}

interface ArtifactFileData {
  file_url: string
  name: string
  format_type: string
}

interface ProjectRecord {
  id: string
  title: string
  topic: string
  style: string
  duration: number
  createdAt: string
  status: 'draft' | 'scripted' | 'rendered'
  scriptData?: ScriptData
  visualData?: VisualData
  images?: ArtifactFileData[]
}

type ScreenType = 'dashboard' | 'script-preview' | 'render-preview'

// ==================== CONSTANTS ====================
const MANAGER_AGENT_ID = '69a108c100c1fa2770ac9d59'
const SCENE_DIRECTOR_AGENT_ID = '69a108c199b862436211044d'

const AGENTS = [
  { id: MANAGER_AGENT_ID, name: 'Video Script Coordinator', role: 'Manages research & script generation', icon: HiOutlineVideoCamera },
  { id: '69a108a0d8049284e8798d9e', name: 'Topic Research Agent', role: 'Researches topics thoroughly', icon: HiOutlineBeaker },
  { id: '69a108a17e53a1840a00a30a', name: 'Scriptwriter Agent', role: 'Creates scene-by-scene scripts', icon: HiOutlineDocumentText },
  { id: SCENE_DIRECTOR_AGENT_ID, name: 'Scene Director Agent', role: 'Generates visual direction & images', icon: HiOutlinePaintBrush },
]

// ==================== SAMPLE DATA ====================
const SAMPLE_SCRIPT: ScriptData = {
  title: 'Understanding Quantum Computing: A Visual Journey',
  topic: 'Quantum Computing for Beginners',
  total_duration_seconds: 180,
  style: 'animated',
  research_summary: 'Quantum computing leverages quantum mechanical phenomena such as superposition and entanglement to process information in fundamentally different ways from classical computers. Key concepts include qubits (which can exist in multiple states simultaneously), quantum gates (which manipulate qubits), and quantum algorithms (like Shor\'s algorithm for factoring and Grover\'s algorithm for searching).',
  scenes: [
    { scene_number: 1, scene_title: 'Introduction to the Quantum World', narration_text: 'Imagine a computer that doesn\'t just think in ones and zeros, but can consider countless possibilities at once. Welcome to the world of quantum computing.', scene_description: 'Animated visualization of binary digits transforming into quantum states, with particles floating and interacting in a cosmic environment.', duration_seconds: 30, transition: 'fade' },
    { scene_number: 2, scene_title: 'Classical vs Quantum Bits', narration_text: 'While classical bits are like light switches - either on or off - qubits are more like a spinning coin. They can be heads, tails, or any combination of both until observed.', scene_description: 'Split screen comparing a light switch flipping on/off with a coin spinning in the air, gradually transitioning to abstract representations of quantum states.', duration_seconds: 35, transition: 'slide' },
    { scene_number: 3, scene_title: 'Superposition Explained', narration_text: 'This property is called superposition. It allows quantum computers to process multiple calculations simultaneously, giving them their extraordinary power.', scene_description: 'Visualization of a qubit in superposition, showing probability clouds and wave functions with colorful, dynamic animations.', duration_seconds: 30, transition: 'morph' },
    { scene_number: 4, scene_title: 'Quantum Entanglement', narration_text: 'When qubits become entangled, measuring one instantly reveals information about the other, no matter how far apart they are. Einstein called this "spooky action at a distance."', scene_description: 'Two connected particles represented as glowing orbs, with visual connections stretching across space, demonstrating instantaneous correlation.', duration_seconds: 40, transition: 'dissolve' },
    { scene_number: 5, scene_title: 'Real-World Applications', narration_text: 'From drug discovery to cryptography, climate modeling to artificial intelligence, quantum computing promises to revolutionize industries across the board.', scene_description: 'Montage of real-world applications: molecular structures being analyzed, encrypted data shields, weather patterns, and neural networks.', duration_seconds: 30, transition: 'zoom' },
    { scene_number: 6, scene_title: 'The Future is Quantum', narration_text: 'While still in its early stages, quantum computing is advancing rapidly. The quantum revolution is not just coming, it\'s already here.', scene_description: 'A timeline showing quantum computing milestones, ending with a futuristic cityscape powered by quantum technology.', duration_seconds: 15, transition: 'fade-out' },
  ],
}

const SAMPLE_VISUALS: VisualData = {
  video_title: 'Understanding Quantum Computing: A Visual Journey',
  visual_style: 'Modern animated with cosmic color palette',
  scene_visuals: [
    { scene_number: 1, image_prompt: 'Cosmic space environment with floating binary digits transforming into colorful quantum particles, deep blue and purple background, cinematic lighting', layout_description: 'Full screen immersive background with centered title text overlay', color_palette: { primary: '#1a0533', secondary: '#4a0e8f', accent: '#00d4ff' }, motion_notes: 'Slow zoom in with particle drift animation, binary digits dissolving into quantum states', text_overlay: { text: 'The Quantum World', position: 'center', animation: 'fade-in-up' } },
    { scene_number: 2, image_prompt: 'Split screen: left side classic light switch on/off in warm colors, right side glowing spinning coin with quantum probability clouds in cool colors', layout_description: 'Vertical split with clear divider, labels on each side', color_palette: { primary: '#2d1b4e', secondary: '#ff6b35', accent: '#00e5ff' }, motion_notes: 'Switch flips on left while coin spins on right, gradual blend at center', text_overlay: { text: 'Classical vs Quantum', position: 'top-center', animation: 'slide-in' } },
    { scene_number: 3, image_prompt: 'Abstract visualization of quantum superposition, a glowing sphere existing in multiple states simultaneously, surrounded by probability wave functions in neon colors', layout_description: 'Central focal point with radiating wave patterns filling the frame', color_palette: { primary: '#0d0221', secondary: '#cc00ff', accent: '#00ff88' }, motion_notes: 'Pulsating sphere with expanding concentric rings, wave interference patterns', text_overlay: { text: 'Superposition', position: 'bottom-center', animation: 'pulse-in' } },
  ],
}

const SAMPLE_IMAGES: ArtifactFileData[] = [
  { file_url: 'https://placehold.co/800x450/1a0533/00d4ff?text=Scene+1', name: 'scene_1_visual.png', format_type: 'image/png' },
  { file_url: 'https://placehold.co/800x450/2d1b4e/ff6b35?text=Scene+2', name: 'scene_2_visual.png', format_type: 'image/png' },
  { file_url: 'https://placehold.co/800x450/0d0221/cc00ff?text=Scene+3', name: 'scene_3_visual.png', format_type: 'image/png' },
]

const SAMPLE_PROJECTS: ProjectRecord[] = [
  { id: 'p1', title: 'AI in Healthcare', topic: 'How AI is transforming medical diagnosis', style: 'corporate', duration: 180, createdAt: '2025-02-25', status: 'rendered' },
  { id: 'p2', title: 'Climate Change Solutions', topic: 'Innovative technologies fighting climate change', style: 'animated', duration: 240, createdAt: '2025-02-24', status: 'scripted' },
  { id: 'p3', title: 'Blockchain Basics', topic: 'Understanding blockchain and cryptocurrency', style: 'minimal', duration: 120, createdAt: '2025-02-23', status: 'draft' },
]

// ==================== ERROR BOUNDARY ====================
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ==================== HELPERS ====================
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function generateId(): string {
  return 'p' + Math.random().toString(36).substring(2, 9)
}

// ==================== SIDEBAR COMPONENT ====================
function SidebarNav({
  currentScreen,
  onNavigate,
  projects,
  onSelectProject,
  activeAgentId,
}: {
  currentScreen: ScreenType
  onNavigate: (screen: ScreenType) => void
  projects: ProjectRecord[]
  onSelectProject: (project: ProjectRecord) => void
  activeAgentId: string | null
}) {
  const [showAgents, setShowAgents] = useState(false)

  return (
    <div className="w-64 flex-shrink-0 h-screen flex flex-col border-r-2 border-[hsl(20,30%,12%)] bg-[hsl(20,40%,5%)]">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[hsl(24,80%,45%)] flex items-center justify-center">
            <FiFilm className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-extrabold tracking-tight text-[hsl(30,30%,95%)]">VideoForge</h1>
            <p className="text-[10px] uppercase tracking-widest text-[hsl(30,20%,60%)]">AI Studio</p>
          </div>
        </div>
      </div>

      <Separator className="bg-[hsl(20,30%,12%)]" />

      <div className="p-4 space-y-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
            currentScreen === 'dashboard'
              ? 'bg-[hsl(24,80%,45%)] text-white font-semibold shadow-lg shadow-[hsl(24,80%,45%)]/20'
              : 'text-[hsl(30,20%,60%)] hover:bg-[hsl(20,30%,12%)] hover:text-[hsl(30,30%,95%)]'
          )}
        >
          <FiHome className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('script-preview')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
            currentScreen === 'script-preview'
              ? 'bg-[hsl(24,80%,45%)] text-white font-semibold shadow-lg shadow-[hsl(24,80%,45%)]/20'
              : 'text-[hsl(30,20%,60%)] hover:bg-[hsl(20,30%,12%)] hover:text-[hsl(30,30%,95%)]'
          )}
        >
          <FiEdit3 className="w-4 h-4" />
          Script Editor
        </button>
        <button
          onClick={() => onNavigate('render-preview')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
            currentScreen === 'render-preview'
              ? 'bg-[hsl(24,80%,45%)] text-white font-semibold shadow-lg shadow-[hsl(24,80%,45%)]/20'
              : 'text-[hsl(30,20%,60%)] hover:bg-[hsl(20,30%,12%)] hover:text-[hsl(30,30%,95%)]'
          )}
        >
          <FiEye className="w-4 h-4" />
          Render Preview
        </button>
      </div>

      <Separator className="bg-[hsl(20,30%,12%)]" />

      <div className="flex-1 overflow-hidden flex flex-col px-4 pt-4">
        <p className="text-xs uppercase tracking-wider text-[hsl(30,20%,60%)] font-semibold mb-3 px-1">Recent Projects</p>
        <ScrollArea className="flex-1">
          <div className="space-y-1.5 pr-2">
            {Array.isArray(projects) && projects.length > 0 ? (
              projects.slice(0, 10).map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-[hsl(30,20%,60%)] hover:bg-[hsl(20,30%,12%)] hover:text-[hsl(30,30%,95%)]"
                >
                  <div className="flex items-center gap-2">
                    <FiFolder className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">{proj.title || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(20,30%,15%)] text-[hsl(30,20%,60%)]">
                      {proj.status}
                    </Badge>
                    <span className="text-[10px] text-[hsl(30,20%,60%)]">{proj.createdAt}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-[hsl(30,20%,60%)] px-3 py-4">No projects yet. Create one to get started.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-[hsl(20,30%,12%)]" />

      <div className="p-4">
        <Collapsible open={showAgents} onOpenChange={setShowAgents}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-1 text-xs uppercase tracking-wider text-[hsl(30,20%,60%)] font-semibold hover:text-[hsl(30,30%,95%)] transition-colors">
            <span className="flex items-center gap-2">
              <FiActivity className="w-3.5 h-3.5" />
              AI Agents
            </span>
            {showAgents ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 space-y-2">
              {AGENTS.map((agent) => {
                const AgentIcon = agent.icon
                const isActive = activeAgentId === agent.id
                return (
                  <div key={agent.id} className="flex items-start gap-2.5 px-1">
                    <div className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                      isActive ? 'bg-[hsl(24,80%,45%)]' : 'bg-[hsl(20,30%,15%)]'
                    )}>
                      <AgentIcon className={cn('w-3 h-3', isActive ? 'text-white' : 'text-[hsl(30,20%,60%)]')} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'text-xs font-medium truncate transition-colors',
                        isActive ? 'text-[hsl(24,80%,45%)]' : 'text-[hsl(30,30%,95%)]'
                      )}>
                        {agent.name}
                        {isActive && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[hsl(24,80%,45%)] animate-pulse" />}
                      </p>
                      <p className="text-[10px] text-[hsl(30,20%,60%)] truncate">{agent.role}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

// ==================== DASHBOARD SCREEN ====================
function DashboardScreen({
  topic,
  setTopic,
  videoLength,
  setVideoLength,
  videoStyle,
  setVideoStyle,
  onGenerate,
  isGenerating,
  loadingStage,
  projects,
  onSelectProject,
  sampleMode,
  error,
}: {
  topic: string
  setTopic: (v: string) => void
  videoLength: string
  setVideoLength: (v: string) => void
  videoStyle: string
  setVideoStyle: (v: string) => void
  onGenerate: () => void
  isGenerating: boolean
  loadingStage: string
  projects: ProjectRecord[]
  onSelectProject: (p: ProjectRecord) => void
  sampleMode: boolean
  error: string | null
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[hsl(30,30%,95%)]">Create Your Video</h2>
          <p className="mt-2 text-sm text-[hsl(30,20%,60%)] leading-relaxed max-w-xl">
            Describe your topic and let our AI agents research, write, and design your explainer video from start to finish.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-xl font-extrabold tracking-tight text-[hsl(30,30%,95%)] flex items-center gap-2">
                  <HiOutlineSparkles className="w-5 h-5 text-[hsl(24,80%,45%)]" />
                  New Video Project
                </CardTitle>
                <CardDescription className="text-[hsl(30,20%,60%)] text-sm">
                  Enter your topic and configure your video settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[hsl(30,30%,95%)]">Topic</Label>
                  <Textarea
                    placeholder="Describe your explainer video topic... e.g., 'How quantum computing works for beginners'"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[120px] bg-[hsl(20,30%,20%)] border-2 border-[hsl(20,30%,15%)] rounded-xl text-[hsl(30,30%,95%)] placeholder:text-[hsl(30,20%,60%)]/50 focus:border-[hsl(24,80%,45%)] focus:ring-[hsl(24,80%,45%)]/20 resize-none"
                    disabled={isGenerating}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[hsl(30,30%,95%)]">Video Length</Label>
                    <Select value={videoLength} onValueChange={setVideoLength} disabled={isGenerating}>
                      <SelectTrigger className="bg-[hsl(20,30%,20%)] border-2 border-[hsl(20,30%,15%)] rounded-xl text-[hsl(30,30%,95%)] focus:border-[hsl(24,80%,45%)]">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)]">
                        <SelectItem value="1-3">1 - 3 minutes</SelectItem>
                        <SelectItem value="3-5">3 - 5 minutes</SelectItem>
                        <SelectItem value="5-10">5 - 10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[hsl(30,30%,95%)]">Visual Style</Label>
                    <Select value={videoStyle} onValueChange={setVideoStyle} disabled={isGenerating}>
                      <SelectTrigger className="bg-[hsl(20,30%,20%)] border-2 border-[hsl(20,30%,15%)] rounded-xl text-[hsl(30,30%,95%)] focus:border-[hsl(24,80%,45%)]">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)]">
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(0,63%,31%)]/10 border border-[hsl(0,63%,31%)]/30">
                    <FiAlertCircle className="w-5 h-5 text-[hsl(0,63%,31%)] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[hsl(0,63%,31%)]">{error}</p>
                  </div>
                )}

                <Button
                  onClick={onGenerate}
                  disabled={isGenerating || (!topic.trim() && !sampleMode)}
                  className="w-full h-12 bg-[hsl(24,80%,45%)] hover:bg-[hsl(24,80%,50%)] text-white font-semibold rounded-xl shadow-lg shadow-[hsl(24,80%,45%)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[hsl(24,80%,45%)]/30 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <FiLoader className="w-4 h-4 animate-spin" />
                      {loadingStage || 'Processing...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <HiOutlineSparkles className="w-5 h-5" />
                      Generate Video Script
                    </span>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(24,80%,45%)] flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-[hsl(30,30%,95%)]">Topic received</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                        loadingStage === 'Researching topic...' ? 'bg-[hsl(24,80%,45%)] animate-pulse' : loadingStage === 'Writing script...' ? 'bg-[hsl(24,80%,45%)]' : 'bg-[hsl(20,30%,15%)]'
                      )}>
                        {loadingStage === 'Researching topic...' ? (
                          <FiLoader className="w-3 h-3 text-white animate-spin" />
                        ) : loadingStage === 'Writing script...' ? (
                          <FiCheck className="w-3 h-3 text-white" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[hsl(30,20%,60%)]" />
                        )}
                      </div>
                      <span className={cn('text-sm', loadingStage === 'Researching topic...' ? 'text-[hsl(24,80%,45%)] font-medium' : 'text-[hsl(30,20%,60%)]')}>
                        Researching topic
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                        loadingStage === 'Writing script...' ? 'bg-[hsl(24,80%,45%)] animate-pulse' : 'bg-[hsl(20,30%,15%)]'
                      )}>
                        {loadingStage === 'Writing script...' ? (
                          <FiLoader className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[hsl(30,20%,60%)]" />
                        )}
                      </div>
                      <span className={cn('text-sm', loadingStage === 'Writing script...' ? 'text-[hsl(24,80%,45%)] font-medium' : 'text-[hsl(30,20%,60%)]')}>
                        Writing script
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-extrabold tracking-tight text-[hsl(30,30%,95%)]">Recent Projects</h3>
              <Badge variant="outline" className="text-[hsl(30,20%,60%)] border-[hsl(20,30%,15%)] text-xs">
                {Array.isArray(projects) ? projects.length : 0} total
              </Badge>
            </div>

            <div className="space-y-3">
              {Array.isArray(projects) && projects.length > 0 ? (
                projects.slice(0, 5).map((proj) => (
                  <Card
                    key={proj.id}
                    className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl hover:border-[hsl(24,80%,45%)]/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                    onClick={() => onSelectProject(proj)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-[hsl(30,30%,95%)] truncate hover:text-[hsl(24,80%,45%)] transition-colors">
                            {proj.title || 'Untitled Project'}
                          </h4>
                          <p className="text-xs text-[hsl(30,20%,60%)] mt-1 truncate">{proj.topic}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={cn(
                              'text-[10px] px-1.5 py-0 rounded-md',
                              proj.status === 'rendered' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              proj.status === 'scripted' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-[hsl(30,20%,60%)]/20 text-[hsl(30,20%,60%)] border-[hsl(20,30%,15%)]'
                            )} variant="outline">
                              {proj.status}
                            </Badge>
                            <span className="text-[10px] text-[hsl(30,20%,60%)]">{formatDuration(proj.duration)}</span>
                            <span className="text-[10px] text-[hsl(30,20%,60%)]">{proj.style}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-14 h-10 rounded-lg bg-[hsl(20,30%,15%)] flex items-center justify-center">
                          <FiFilm className="w-5 h-5 text-[hsl(30,20%,60%)]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] border-dashed rounded-2xl">
                  <CardContent className="p-8 text-center">
                    <FiFilm className="w-10 h-10 text-[hsl(30,20%,60%)]/40 mx-auto mb-3" />
                    <p className="text-sm text-[hsl(30,20%,60%)]">No projects yet</p>
                    <p className="text-xs text-[hsl(30,20%,60%)]/60 mt-1">Generate your first video script to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== SCRIPT PREVIEW SCREEN ====================
function ScriptPreviewScreen({
  scriptData,
  onGenerateVisuals,
  onRegenerateScript,
  onBack,
  isGeneratingVisuals,
  loadingStage,
  onUpdateNarration,
  error,
}: {
  scriptData: ScriptData | null
  onGenerateVisuals: () => void
  onRegenerateScript: () => void
  onBack: () => void
  isGeneratingVisuals: boolean
  loadingStage: string
  onUpdateNarration: (sceneIndex: number, text: string) => void
  error: string | null
}) {
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(() => new Set([0]))
  const [editingScene, setEditingScene] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const scenes = Array.isArray(scriptData?.scenes) ? scriptData.scenes : []
  const totalDuration = scriptData?.total_duration_seconds ?? scenes.reduce((sum, s) => sum + (s?.duration_seconds ?? 0), 0)

  const toggleScene = (idx: number) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const startEdit = (idx: number, text: string) => {
    setEditingScene(idx)
    setEditText(text)
  }

  const saveEdit = (idx: number) => {
    onUpdateNarration(idx, editText)
    setEditingScene(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingScene(null)
    setEditText('')
  }

  if (!scriptData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <FiEdit3 className="w-16 h-16 text-[hsl(30,20%,60%)]/30 mx-auto" />
          <h3 className="font-serif text-xl font-extrabold text-[hsl(30,30%,95%)]">No Script Generated</h3>
          <p className="text-sm text-[hsl(30,20%,60%)]">Go to the Dashboard and generate a script first.</p>
          <Button onClick={onBack} variant="outline" className="border-2 border-[hsl(20,30%,15%)] text-[hsl(30,30%,95%)] bg-transparent hover:bg-[hsl(20,30%,12%)] rounded-xl">
            <FiChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Button onClick={onBack} variant="ghost" className="text-[hsl(30,20%,60%)] hover:text-[hsl(30,30%,95%)] hover:bg-[hsl(20,30%,12%)] -ml-3 mb-2 rounded-xl">
              <FiChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
            <h2 className="font-serif text-2xl font-extrabold tracking-tight text-[hsl(30,30%,95%)]">
              {scriptData?.title ?? 'Untitled Script'}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-[hsl(24,80%,45%)]/20 text-[hsl(24,80%,45%)] border-[hsl(24,80%,45%)]/30 rounded-md" variant="outline">
                {scriptData?.style ?? 'N/A'}
              </Badge>
              <span className="flex items-center gap-1.5 text-sm text-[hsl(30,20%,60%)]">
                <FiClock className="w-3.5 h-3.5" />
                {formatDuration(totalDuration)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-[hsl(30,20%,60%)]">
                <FiLayers className="w-3.5 h-3.5" />
                {scenes.length} scenes
              </span>
            </div>
          </div>
        </div>

        {scriptData?.research_summary && (
          <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl mb-6 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[hsl(30,20%,60%)] flex items-center gap-2">
                <HiOutlineBeaker className="w-4 h-4 text-[hsl(24,80%,45%)]" />
                Research Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-[hsl(30,30%,95%)] leading-relaxed">
                {renderMarkdown(scriptData.research_summary)}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 mb-8">
          <h3 className="font-serif text-lg font-extrabold tracking-tight text-[hsl(30,30%,95%)]">Scene Timeline</h3>
          <div className="relative h-2 rounded-full bg-[hsl(20,30%,15%)] overflow-hidden">
            {scenes.map((scene, idx) => {
              const offset = scenes.slice(0, idx).reduce((s, sc) => s + (sc?.duration_seconds ?? 0), 0)
              const pct = totalDuration > 0 ? ((scene?.duration_seconds ?? 0) / totalDuration) * 100 : 0
              const leftPct = totalDuration > 0 ? (offset / totalDuration) * 100 : 0
              const hues = ['hsl(24,85%,55%)', 'hsl(12,75%,55%)', 'hsl(35,80%,55%)', 'hsl(0,70%,55%)', 'hsl(45,85%,55%)', 'hsl(24,85%,55%)']
              return (
                <div
                  key={idx}
                  className="absolute top-0 h-full rounded-full"
                  style={{ left: `${leftPct}%`, width: `${pct}%`, backgroundColor: hues[idx % hues.length] }}
                />
              )
            })}
          </div>

          <div className="space-y-3">
            {scenes.map((scene, idx) => {
              const isExpanded = expandedScenes.has(idx)
              const isEditing = editingScene === idx
              return (
                <Card key={idx} className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl shadow-lg transition-all duration-300 hover:border-[hsl(24,80%,45%)]/20">
                  <button
                    onClick={() => toggleScene(idx)}
                    className="w-full p-5 flex items-center gap-4 text-left"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[hsl(24,80%,45%)]/15 flex items-center justify-center">
                      <span className="text-sm font-extrabold text-[hsl(24,80%,45%)]">{scene?.scene_number ?? idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-[hsl(30,30%,95%)] truncate">
                        {scene?.scene_title ?? 'Untitled Scene'}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[hsl(30,20%,60%)] flex items-center gap-1">
                          <FiClock className="w-3 h-3" /> {formatDuration(scene?.duration_seconds ?? 0)}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(20,30%,15%)] text-[hsl(30,20%,60%)] rounded-md">
                          {scene?.transition ?? 'cut'}
                        </Badge>
                      </div>
                    </div>
                    {isExpanded ? <FiChevronUp className="w-4 h-4 text-[hsl(30,20%,60%)]" /> : <FiChevronDown className="w-4 h-4 text-[hsl(30,20%,60%)]" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-4 border-t-2 border-[hsl(20,30%,15%)]">
                      <div className="pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1.5">Scene Description</p>
                        <p className="text-sm text-[hsl(30,30%,95%)] leading-relaxed bg-[hsl(20,30%,15%)]/50 p-3 rounded-xl">
                          {scene?.scene_description ?? 'No description available'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)]">Narration Text</p>
                          {!isEditing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(idx, scene?.narration_text ?? '') }}
                              className="flex items-center gap-1 text-xs text-[hsl(24,80%,45%)] hover:text-[hsl(24,80%,55%)] transition-colors"
                            >
                              <FiEdit3 className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[80px] bg-[hsl(20,30%,20%)] border-2 border-[hsl(24,80%,45%)]/50 rounded-xl text-[hsl(30,30%,95%)] text-sm focus:border-[hsl(24,80%,45%)] resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); saveEdit(idx) }}
                                className="bg-[hsl(24,80%,45%)] hover:bg-[hsl(24,80%,50%)] text-white rounded-lg text-xs h-8"
                              >
                                <FiCheck className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                                className="text-[hsl(30,20%,60%)] hover:bg-[hsl(20,30%,12%)] rounded-lg text-xs h-8"
                              >
                                <FiX className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[hsl(30,30%,95%)] leading-relaxed italic bg-[hsl(20,30%,15%)]/50 p-3 rounded-xl border-l-2 border-[hsl(24,80%,45%)]/40">
                            &ldquo;{scene?.narration_text ?? 'No narration text'}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(0,63%,31%)]/10 border border-[hsl(0,63%,31%)]/30 mb-6">
            <FiAlertCircle className="w-5 h-5 text-[hsl(0,63%,31%)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[hsl(0,63%,31%)]">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            onClick={onGenerateVisuals}
            disabled={isGeneratingVisuals || scenes.length === 0}
            className="flex-1 h-12 bg-[hsl(24,80%,45%)] hover:bg-[hsl(24,80%,50%)] text-white font-semibold rounded-xl shadow-lg shadow-[hsl(24,80%,45%)]/20 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
          >
            {isGeneratingVisuals ? (
              <span className="flex items-center gap-2">
                <FiLoader className="w-4 h-4 animate-spin" />
                {loadingStage || 'Generating visuals...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiImage className="w-5 h-5" />
                Generate Visuals & Render
                <FiArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
          <Button
            onClick={onRegenerateScript}
            disabled={isGeneratingVisuals}
            variant="outline"
            className="h-12 border-2 border-[hsl(20,30%,15%)] text-[hsl(30,30%,95%)] bg-transparent hover:bg-[hsl(20,30%,12%)] rounded-xl"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==================== RENDER PREVIEW SCREEN ====================
function RenderPreviewScreen({
  scriptData,
  visualData,
  generatedImages,
  isGeneratingVisuals,
  loadingStage,
  renderProgress,
  onBack,
  onDownload,
  error,
}: {
  scriptData: ScriptData | null
  visualData: VisualData | null
  generatedImages: ArtifactFileData[]
  isGeneratingVisuals: boolean
  loadingStage: string
  renderProgress: number
  onBack: () => void
  onDownload: () => void
  error: string | null
}) {
  const sceneVisuals = Array.isArray(visualData?.scene_visuals) ? visualData.scene_visuals : []
  const images = Array.isArray(generatedImages) ? generatedImages : []
  const [selectedVisual, setSelectedVisual] = useState(0)

  if (!visualData && !isGeneratingVisuals) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <FiImage className="w-16 h-16 text-[hsl(30,20%,60%)]/30 mx-auto" />
          <h3 className="font-serif text-xl font-extrabold text-[hsl(30,30%,95%)]">No Visuals Generated</h3>
          <p className="text-sm text-[hsl(30,20%,60%)]">Go to the Script Editor and generate visuals first.</p>
          <Button onClick={onBack} variant="outline" className="border-2 border-[hsl(20,30%,15%)] text-[hsl(30,30%,95%)] bg-transparent hover:bg-[hsl(20,30%,12%)] rounded-xl">
            <FiChevronLeft className="w-4 h-4 mr-2" />
            Back to Script Editor
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="text-[hsl(30,20%,60%)] hover:text-[hsl(30,30%,95%)] hover:bg-[hsl(20,30%,12%)] -ml-3 mb-2 rounded-xl">
            <FiChevronLeft className="w-4 h-4 mr-1" />
            Back to Script Editor
          </Button>
          <h2 className="font-serif text-2xl font-extrabold tracking-tight text-[hsl(30,30%,95%)]">
            Render & Preview
          </h2>
          <p className="text-sm text-[hsl(30,20%,60%)] mt-1">
            {visualData?.video_title ?? scriptData?.title ?? 'Untitled'} — {visualData?.visual_style ?? 'Default style'}
          </p>
        </div>

        {isGeneratingVisuals && (
          <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl mb-6 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[hsl(30,30%,95%)]">Generating Visual Direction</h3>
                <span className="text-xs text-[hsl(24,80%,45%)] font-medium">{Math.round(renderProgress)}%</span>
              </div>
              <Progress value={renderProgress} className="h-2 bg-[hsl(20,30%,15%)]" />
              <div className="flex items-center gap-6">
                {['Generating visuals', 'Processing scenes', 'Finalizing'].map((stage, idx) => {
                  const stageProgress = Math.floor(renderProgress / 33)
                  const isCompleted = idx < stageProgress
                  const isCurrent = idx === stageProgress
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                        isCompleted ? 'bg-[hsl(24,80%,45%)]' : isCurrent ? 'bg-[hsl(24,80%,45%)] animate-pulse' : 'bg-[hsl(20,30%,15%)]'
                      )}>
                        {isCompleted ? <FiCheck className="w-3 h-3 text-white" /> : isCurrent ? <FiLoader className="w-3 h-3 text-white animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-[hsl(30,20%,60%)]" />}
                      </div>
                      <span className={cn(
                        'text-xs',
                        isCompleted || isCurrent ? 'text-[hsl(30,30%,95%)]' : 'text-[hsl(30,20%,60%)]'
                      )}>{stage}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(0,63%,31%)]/10 border border-[hsl(0,63%,31%)]/30 mb-6">
            <FiAlertCircle className="w-5 h-5 text-[hsl(0,63%,31%)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[hsl(0,63%,31%)]">{error}</p>
          </div>
        )}

        {!isGeneratingVisuals && (
          <>
            {images.length > 0 && (
              <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl mb-6 shadow-xl overflow-hidden">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {images[selectedVisual]?.file_url ? (
                    <img
                      src={images[selectedVisual].file_url}
                      alt={images[selectedVisual]?.name ?? `Scene ${selectedVisual + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-[hsl(30,20%,60%)]">
                      <FiMonitor className="w-16 h-16 opacity-30" />
                      <p className="text-sm">No image available</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs">
                      Scene {selectedVisual + 1} / {images.length}
                    </Badge>
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedVisual((prev) => Math.max(0, prev - 1))}
                        disabled={selectedVisual === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                      >
                        <FiChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedVisual((prev) => Math.min(images.length - 1, prev + 1))}
                        disabled={selectedVisual === images.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                      >
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-3 flex gap-2 overflow-x-auto">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVisual(idx)}
                        className={cn(
                          'flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all',
                          idx === selectedVisual ? 'border-[hsl(24,80%,45%)] shadow-lg shadow-[hsl(24,80%,45%)]/20' : 'border-[hsl(20,30%,15%)] opacity-60 hover:opacity-100'
                        )}
                      >
                        {img?.file_url ? (
                          <img src={img.file_url} alt={img?.name ?? `Scene ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[hsl(20,30%,15%)] flex items-center justify-center">
                            <FiImage className="w-3 h-3 text-[hsl(30,20%,60%)]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {images.length === 0 && sceneVisuals.length > 0 && (
              <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl mb-6 shadow-xl">
                <CardContent className="p-8 text-center">
                  <FiImage className="w-12 h-12 text-[hsl(30,20%,60%)]/40 mx-auto mb-3" />
                  <p className="text-sm text-[hsl(30,30%,95%)] font-medium">Visual Direction Generated</p>
                  <p className="text-xs text-[hsl(30,20%,60%)] mt-1">Image generation prompts are ready. See scene details below.</p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="visuals" className="mb-6">
              <TabsList className="bg-[hsl(20,30%,15%)] rounded-xl p-1 h-auto">
                <TabsTrigger value="visuals" className="rounded-lg text-xs data-[state=active]:bg-[hsl(24,80%,45%)] data-[state=active]:text-white">
                  Scene Visuals ({sceneVisuals.length})
                </TabsTrigger>
                <TabsTrigger value="metadata" className="rounded-lg text-xs data-[state=active]:bg-[hsl(24,80%,45%)] data-[state=active]:text-white">
                  Project Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visuals" className="mt-4">
                <div className="space-y-4">
                  {sceneVisuals.map((sv, idx) => (
                    <Card key={idx} className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl shadow-lg">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-[hsl(20,30%,15%)]">
                            {images[idx]?.file_url ? (
                              <img src={images[idx].file_url} alt={`Scene ${sv?.scene_number ?? idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiImage className="w-5 h-5 text-[hsl(30,20%,60%)]" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[hsl(24,80%,45%)]/15 text-[hsl(24,80%,45%)] border-[hsl(24,80%,45%)]/30 rounded-md text-xs" variant="outline">
                                Scene {sv?.scene_number ?? idx + 1}
                              </Badge>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Image Prompt</p>
                              <p className="text-xs text-[hsl(30,30%,95%)] leading-relaxed">{sv?.image_prompt ?? 'N/A'}</p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Layout</p>
                              <p className="text-xs text-[hsl(30,30%,95%)]">{sv?.layout_description ?? 'N/A'}</p>
                            </div>

                            {sv?.color_palette && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1.5">Color Palette</p>
                                <div className="flex items-center gap-3">
                                  {[
                                    { label: 'Primary', color: sv.color_palette?.primary },
                                    { label: 'Secondary', color: sv.color_palette?.secondary },
                                    { label: 'Accent', color: sv.color_palette?.accent },
                                  ].map((c, ci) => c.color ? (
                                    <div key={ci} className="flex items-center gap-1.5">
                                      <div className="w-4 h-4 rounded-md border border-white/10" style={{ backgroundColor: c.color }} />
                                      <span className="text-[10px] text-[hsl(30,20%,60%)]">{c.label}</span>
                                    </div>
                                  ) : null)}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {sv?.motion_notes && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Motion Notes</p>
                                  <p className="text-xs text-[hsl(30,30%,95%)]">{sv.motion_notes}</p>
                                </div>
                              )}
                              {sv?.text_overlay && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Text Overlay</p>
                                  <p className="text-xs text-[hsl(30,30%,95%)]">&ldquo;{sv.text_overlay?.text ?? ''}&rdquo;</p>
                                  <p className="text-[10px] text-[hsl(30,20%,60%)] mt-0.5">
                                    {sv.text_overlay?.position ?? ''}{sv.text_overlay?.animation ? ` / ${sv.text_overlay.animation}` : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {sceneVisuals.length === 0 && (
                    <div className="text-center py-12 text-[hsl(30,20%,60%)]">
                      <FiImage className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No scene visual data available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="mt-4">
                <Card className="bg-[hsl(20,40%,6%)] border-2 border-[hsl(20,30%,15%)] rounded-2xl shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Topic</p>
                        <p className="text-sm text-[hsl(30,30%,95%)]">{scriptData?.topic ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Style</p>
                        <p className="text-sm text-[hsl(30,30%,95%)]">{scriptData?.style ?? visualData?.visual_style ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Duration</p>
                        <p className="text-sm text-[hsl(30,30%,95%)]">{formatDuration(scriptData?.total_duration_seconds ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Scenes</p>
                        <p className="text-sm text-[hsl(30,30%,95%)]">{Array.isArray(scriptData?.scenes) ? scriptData.scenes.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Visual Style</p>
                        <p className="text-sm text-[hsl(30,30%,95%)]">{visualData?.visual_style ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(30,20%,60%)] mb-1">Images Generated</p>
                        <p className="text-sm text-[hsl(30,30%,95%)]">{images.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-4">
              <Button
                onClick={onDownload}
                className="flex-1 h-12 bg-[hsl(24,80%,45%)] hover:bg-[hsl(24,80%,50%)] text-white font-semibold rounded-xl shadow-lg shadow-[hsl(24,80%,45%)]/20 transition-all duration-300"
              >
                <FiDownload className="w-5 h-5 mr-2" />
                Download Project JSON
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="h-12 border-2 border-[hsl(20,30%,15%)] text-[hsl(30,30%,95%)] bg-transparent hover:bg-[hsl(20,30%,12%)] rounded-xl"
              >
                <FiEdit3 className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ==================== MAIN PAGE EXPORT ====================
export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard')
  const [topic, setTopic] = useState('')
  const [videoLength, setVideoLength] = useState('1-3')
  const [videoStyle, setVideoStyle] = useState('animated')
  const [scriptData, setScriptData] = useState<ScriptData | null>(null)
  const [visualData, setVisualData] = useState<VisualData | null>(null)
  const [generatedImages, setGeneratedImages] = useState<ArtifactFileData[]>([])
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [renderProgress, setRenderProgress] = useState(0)
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('videoforge-projects')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setProjects(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const saveProjects = useCallback((updatedProjects: ProjectRecord[]) => {
    setProjects(updatedProjects)
    try {
      localStorage.setItem('videoforge-projects', JSON.stringify(updatedProjects))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (sampleMode) {
      setTopic('How quantum computing works for beginners')
      setVideoStyle('animated')
      setVideoLength('1-3')
      setScriptData(SAMPLE_SCRIPT)
      setVisualData(SAMPLE_VISUALS)
      setGeneratedImages(SAMPLE_IMAGES)
      if (projects.length === 0) {
        setProjects(SAMPLE_PROJECTS)
      }
    }
  }, [sampleMode])

  const handleGenerateScript = useCallback(async () => {
    const currentTopic = topic.trim()
    if (!currentTopic && !sampleMode) return

    if (sampleMode) {
      setScriptData(SAMPLE_SCRIPT)
      setCurrentScreen('script-preview')
      return
    }

    setError(null)
    setIsGeneratingScript(true)
    setLoadingStage('Researching topic...')
    setActiveAgentId(MANAGER_AGENT_ID)

    try {
      const message = `Create an explainer video script about: ${currentTopic}\n\nVideo Configuration:\n- Length: ${videoLength} minutes\n- Style: ${videoStyle}\n\nPlease research the topic thoroughly and generate a complete scene-by-scene script with narration text, scene descriptions, timing, and transitions.`

      const researchTimer = setTimeout(() => {
        setLoadingStage('Writing script...')
      }, 8000)

      const result = await callAIAgent(message, MANAGER_AGENT_ID)
      clearTimeout(researchTimer)

      if (result.success) {
        const parsed = parseLLMJson(result?.response?.result)
        if (parsed && typeof parsed === 'object' && !parsed.error) {
          const data: ScriptData = {
            title: parsed?.title ?? 'Untitled Video',
            topic: parsed?.topic ?? currentTopic,
            total_duration_seconds: parsed?.total_duration_seconds ?? 0,
            style: parsed?.style ?? videoStyle,
            research_summary: parsed?.research_summary ?? '',
            scenes: Array.isArray(parsed?.scenes) ? parsed.scenes.map((s: any, idx: number) => ({
              scene_number: s?.scene_number ?? idx + 1,
              scene_title: s?.scene_title ?? `Scene ${idx + 1}`,
              narration_text: s?.narration_text ?? '',
              scene_description: s?.scene_description ?? '',
              duration_seconds: s?.duration_seconds ?? 30,
              transition: s?.transition ?? 'cut',
            })) : [],
          }
          if (!data.total_duration_seconds && data.scenes.length > 0) {
            data.total_duration_seconds = data.scenes.reduce((sum, s) => sum + s.duration_seconds, 0)
          }
          setScriptData(data)

          const newProject: ProjectRecord = {
            id: generateId(),
            title: data.title,
            topic: data.topic,
            style: data.style,
            duration: data.total_duration_seconds,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'scripted',
            scriptData: data,
          }
          saveProjects([newProject, ...projects])
          setCurrentScreen('script-preview')
        } else {
          setError('Could not parse the script response. Please try again.')
        }
      } else {
        setError(result?.error ?? 'Failed to generate script. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsGeneratingScript(false)
      setLoadingStage('')
      setActiveAgentId(null)
    }
  }, [topic, videoLength, videoStyle, sampleMode, projects, saveProjects])

  const handleGenerateVisuals = useCallback(async () => {
    if (!scriptData) return

    if (sampleMode) {
      setVisualData(SAMPLE_VISUALS)
      setGeneratedImages(SAMPLE_IMAGES)
      setCurrentScreen('render-preview')
      return
    }

    setError(null)
    setIsGeneratingVisuals(true)
    setLoadingStage('Generating visuals...')
    setActiveAgentId(SCENE_DIRECTOR_AGENT_ID)
    setRenderProgress(0)
    setCurrentScreen('render-preview')

    progressIntervalRef.current = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 8 + 2
      })
    }, 1500)

    try {
      const scenesJson = Array.isArray(scriptData?.scenes) ? JSON.stringify(scriptData.scenes, null, 2) : '[]'
      const message = `Generate visual direction for this explainer video script:\n\nTitle: ${scriptData?.title ?? 'Untitled'}\nStyle: ${scriptData?.style ?? 'animated'}\nTotal Duration: ${scriptData?.total_duration_seconds ?? 0} seconds\n\nScenes:\n${scenesJson}\n\nFor each scene, provide detailed image generation prompts, layout descriptions, color palettes, motion notes, and text overlay specifications.`

      const result = await callAIAgent(message, SCENE_DIRECTOR_AGENT_ID)

      if (result.success) {
        const parsed = parseLLMJson(result?.response?.result)
        if (parsed && typeof parsed === 'object' && !parsed.error) {
          const vData: VisualData = {
            video_title: parsed?.video_title ?? scriptData?.title ?? 'Untitled',
            visual_style: parsed?.visual_style ?? 'Default',
            scene_visuals: Array.isArray(parsed?.scene_visuals) ? parsed.scene_visuals.map((sv: any, idx: number) => ({
              scene_number: sv?.scene_number ?? idx + 1,
              image_prompt: sv?.image_prompt ?? '',
              layout_description: sv?.layout_description ?? '',
              color_palette: {
                primary: sv?.color_palette?.primary ?? '#333333',
                secondary: sv?.color_palette?.secondary ?? '#666666',
                accent: sv?.color_palette?.accent ?? '#999999',
              },
              motion_notes: sv?.motion_notes ?? '',
              text_overlay: {
                text: sv?.text_overlay?.text ?? '',
                position: sv?.text_overlay?.position ?? 'center',
                animation: sv?.text_overlay?.animation ?? 'fade-in',
              },
            })) : [],
          }
          setVisualData(vData)

          const artifactFiles = Array.isArray(result?.module_outputs?.artifact_files)
            ? result.module_outputs!.artifact_files
            : []
          setGeneratedImages(artifactFiles)

          const updatedProjects = projects.map((p) => {
            if (p.title === scriptData?.title) {
              return { ...p, status: 'rendered' as const, visualData: vData, images: artifactFiles }
            }
            return p
          })
          saveProjects(updatedProjects)
        } else {
          setError('Could not parse visual direction response. Please try again.')
        }
      } else {
        setError(result?.error ?? 'Failed to generate visuals. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setRenderProgress(100)
      setTimeout(() => {
        setIsGeneratingVisuals(false)
        setLoadingStage('')
        setActiveAgentId(null)
      }, 500)
    }
  }, [scriptData, sampleMode, projects, saveProjects])

  const handleRegenerateScript = useCallback(() => {
    setScriptData(null)
    setVisualData(null)
    setGeneratedImages([])
    setCurrentScreen('dashboard')
  }, [])

  const handleUpdateNarration = useCallback((sceneIndex: number, text: string) => {
    if (!scriptData) return
    const scenes = Array.isArray(scriptData.scenes) ? [...scriptData.scenes] : []
    if (scenes[sceneIndex]) {
      scenes[sceneIndex] = { ...scenes[sceneIndex], narration_text: text }
      setScriptData({ ...scriptData, scenes })
    }
  }, [scriptData])

  const handleSelectProject = useCallback((project: ProjectRecord) => {
    if (project.scriptData) {
      setScriptData(project.scriptData)
      setTopic(project.topic)
      setVideoStyle(project.style)
      if (project.visualData) {
        setVisualData(project.visualData)
        setGeneratedImages(Array.isArray(project.images) ? project.images : [])
        setCurrentScreen('render-preview')
      } else {
        setCurrentScreen('script-preview')
      }
    } else {
      setTopic(project.topic)
      setVideoStyle(project.style)
      setCurrentScreen('dashboard')
    }
  }, [])

  const handleDownload = useCallback(() => {
    const projectData = {
      title: scriptData?.title ?? 'Untitled',
      topic: scriptData?.topic ?? '',
      style: scriptData?.style ?? '',
      total_duration_seconds: scriptData?.total_duration_seconds ?? 0,
      scenes: scriptData?.scenes ?? [],
      visual_direction: visualData ?? null,
      generated_images: generatedImages.map((img) => ({
        name: img?.name ?? '',
        url: img?.file_url ?? '',
        format: img?.format_type ?? '',
      })),
    }
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(scriptData?.title ?? 'project').replace(/\s+/g, '_').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [scriptData, visualData, generatedImages])

  const handleNavigate = useCallback((screen: ScreenType) => {
    setError(null)
    setCurrentScreen(screen)
  }, [])

  return (
    <PageErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-[hsl(20,40%,4%)] text-[hsl(30,30%,95%)] flex">
        <SidebarNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          projects={projects}
          onSelectProject={handleSelectProject}
          activeAgentId={activeAgentId}
        />

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <div className="flex items-center justify-between px-8 py-4 border-b-2 border-[hsl(20,30%,15%)] bg-[hsl(20,40%,5%)]">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-base font-extrabold tracking-tight text-[hsl(30,30%,95%)]">
                {currentScreen === 'dashboard' && 'Dashboard'}
                {currentScreen === 'script-preview' && 'Script Editor'}
                {currentScreen === 'render-preview' && 'Render Preview'}
              </h2>
              {activeAgentId && (
                <Badge className="bg-[hsl(24,80%,45%)]/15 text-[hsl(24,80%,45%)] border-[hsl(24,80%,45%)]/30 rounded-lg text-xs animate-pulse" variant="outline">
                  <FiZap className="w-3 h-3 mr-1" />
                  AI Processing
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-[hsl(30,20%,60%)] cursor-pointer">Sample Data</Label>
              <Switch
                id="sample-toggle"
                checked={sampleMode}
                onCheckedChange={setSampleMode}
                className="data-[state=checked]:bg-[hsl(24,80%,45%)]"
              />
            </div>
          </div>

          {currentScreen === 'dashboard' && (
            <DashboardScreen
              topic={topic}
              setTopic={setTopic}
              videoLength={videoLength}
              setVideoLength={setVideoLength}
              videoStyle={videoStyle}
              setVideoStyle={setVideoStyle}
              onGenerate={handleGenerateScript}
              isGenerating={isGeneratingScript}
              loadingStage={loadingStage}
              projects={projects}
              onSelectProject={handleSelectProject}
              sampleMode={sampleMode}
              error={error}
            />
          )}

          {currentScreen === 'script-preview' && (
            <ScriptPreviewScreen
              scriptData={scriptData}
              onGenerateVisuals={handleGenerateVisuals}
              onRegenerateScript={handleRegenerateScript}
              onBack={() => handleNavigate('dashboard')}
              isGeneratingVisuals={isGeneratingVisuals}
              loadingStage={loadingStage}
              onUpdateNarration={handleUpdateNarration}
              error={error}
            />
          )}

          {currentScreen === 'render-preview' && (
            <RenderPreviewScreen
              scriptData={scriptData}
              visualData={visualData}
              generatedImages={generatedImages}
              isGeneratingVisuals={isGeneratingVisuals}
              loadingStage={loadingStage}
              renderProgress={renderProgress}
              onBack={() => handleNavigate('script-preview')}
              onDownload={handleDownload}
              error={error}
            />
          )}
        </div>
      </div>
    </PageErrorBoundary>
  )
}
