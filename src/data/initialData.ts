import { User, Submission, ProgrammingLanguage } from '../types';

export const PRIMARY_OWNER_USER: User = {
  id: 'user-owner',
  name: 'Lead Admin',
  email: 'admin@codescore.dev',
  role: 'admin',
  isSuperAdmin: true,
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin@codescore.dev&backgroundColor=b6e3f4,c0aede,d1d4f9',
  title: 'Lead Administrator & Reviewer',
  badge: 'Super Admin',
  authProvider: 'password',
};

// Initial users array containing only the primary Super Admin account
export const INITIAL_USERS: User[] = [PRIMARY_OWNER_USER];

// Clean slate submissions
export const INITIAL_SUBMISSIONS: Submission[] = [];

export interface CodeTemplateItem {
  title: string;
  desc: string;
  language: ProgrammingLanguage;
  code: string;
}

// Helpful language boilerplate templates for when submitting code
export const CODE_TEMPLATES: Record<string, CodeTemplateItem> = {
  html_css_card: {
    title: 'Glassmorphic Pricing Card with CSS Hover Effects',
    desc: 'Responsive modern pricing card with glassmorphism, gradient accents, badge, and interactive button.',
    language: 'html_css',
    code: `<div class="w-full max-w-sm mx-auto p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl text-slate-900 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
  <div class="flex items-center justify-between mb-4">
    <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
      Pro Tier
    </span>
    <span class="text-xs text-slate-500 font-medium">Billed Annually</span>
  </div>

  <h3 class="text-xl font-extrabold text-slate-900">Developer Suite</h3>
  <p class="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
    Complete tooling for peer code reviews, automated AI grading, and team metrics.
  </p>

  <div class="flex items-baseline gap-1 mb-6">
    <span class="text-4xl font-extrabold text-slate-900">$29</span>
    <span class="text-xs text-slate-500 font-semibold">/ engineer / mo</span>
  </div>

  <ul class="space-y-3 mb-6 text-xs text-slate-600">
    <li class="flex items-center gap-2">
      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
      <span>Unlimited Peer Reviews & Rubrics</span>
    </li>
    <li class="flex items-center gap-2">
      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
      <span>Live HTML / CSS Sandbox Preview</span>
    </li>
    <li class="flex items-center gap-2">
      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
      <span>AI Authenticity & Plagiarism Guard</span>
    </li>
  </ul>

  <button class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2">
    <span>Deploy Workspace</span>
    <span>→</span>
  </button>
</div>`
  },
  html_css_widget: {
    title: 'Interactive Code Review Counter Widget (HTML/JS)',
    desc: 'Lightweight interactive widget with animated buttons and dynamic score calculator.',
    language: 'html_css',
    code: `<div class="max-w-md mx-auto p-6 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 font-sans">
  <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
      <h4 class="text-sm font-bold text-slate-100">Review Rubric Counter</h4>
    </div>
    <span id="badge" class="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      PASSED
    </span>
  </div>

  <div class="space-y-4 text-xs">
    <div>
      <div class="flex justify-between mb-1 text-slate-300 font-medium">
        <span>Correctness (0-40)</span>
        <span id="correctness-val" class="font-bold text-indigo-400">38</span>
      </div>
      <input id="slider-correctness" type="range" min="0" max="40" value="38" class="w-full accent-indigo-500 cursor-pointer">
    </div>

    <div>
      <div class="flex justify-between mb-1 text-slate-300 font-medium">
        <span>Code Style (0-30)</span>
        <span id="style-val" class="font-bold text-indigo-400">28</span>
      </div>
      <input id="slider-style" type="range" min="0" max="30" value="28" class="w-full accent-indigo-500 cursor-pointer">
    </div>

    <div>
      <div class="flex justify-between mb-1 text-slate-300 font-medium">
        <span>Efficiency (0-30)</span>
        <span id="efficiency-val" class="font-bold text-indigo-400">26</span>
      </div>
      <input id="slider-efficiency" type="range" min="0" max="30" value="26" class="w-full accent-indigo-500 cursor-pointer">
    </div>
  </div>

  <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
    <span class="text-xs text-slate-400 font-medium">Calculated Score</span>
    <span id="total-score" class="text-2xl font-black text-indigo-400">92 / 100</span>
  </div>

  <script>
    const sc = document.getElementById('slider-correctness');
    const ss = document.getElementById('slider-style');
    const se = document.getElementById('slider-efficiency');
    const totalEl = document.getElementById('total-score');
    const badgeEl = document.getElementById('badge');

    function update() {
      const c = parseInt(sc.value, 10);
      const s = parseInt(ss.value, 10);
      const e = parseInt(se.value, 10);
      document.getElementById('correctness-val').innerText = c;
      document.getElementById('style-val').innerText = s;
      document.getElementById('efficiency-val').innerText = e;

      const sum = c + s + e;
      totalEl.innerText = sum + ' / 100';

      if (sum >= 80) {
        badgeEl.innerText = 'EXCELLENT';
        badgeEl.className = 'px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      } else if (sum >= 60) {
        badgeEl.innerText = 'SATISFACTORY';
        badgeEl.className = 'px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30';
      } else {
        badgeEl.innerText = 'NEEDS REVISION';
        badgeEl.className = 'px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30';
      }
    }

    sc.addEventListener('input', update);
    ss.addEventListener('input', update);
    se.addEventListener('input', update);
  </script>
</div>`
  },
  typescript: {
    title: 'TypeScript Type-Safe Event Bus',
    desc: 'Generic EventEmitter with compile-time type-checked payloads.',
    language: 'typescript',
    code: `type EventCallback<T = any> = (payload: T) => void;

export class TypedEventBus<Events extends Record<string, any>> {
  private listeners: { [K in keyof Events]?: EventCallback<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);

    // Unsubscribe helper
    return () => {
      this.listeners[event] = this.listeners[event]?.filter((cb) => cb !== callback);
    };
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((cb) => cb(payload));
  }
}`
  },
  python: {
    title: 'Python In-Memory LRU & TTL Cache',
    desc: 'Thread-safe cache manager with expiration timeouts.',
    language: 'python',
    code: `import time
from collections import OrderedDict
from typing import Any, Optional

class TTLCache:
    def __init__(self, max_size: int = 128, default_ttl_seconds: float = 60.0):
        self.max_size = max_size
        self.default_ttl = default_ttl_seconds
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        val, expiry = self._store[key]
        if time.time() > expiry:
            del self._store[key]
            return None
        self._store.move_to_end(key)
        return val

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        expiry = time.time() + (ttl if ttl is not None else self.default_ttl)
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (value, expiry)
        if len(self._store) > self.max_size:
            self._store.popitem(last=False)`
  },
  rust: {
    title: 'Rust Lock-Free Circular Ring Buffer',
    desc: 'Fixed-size memory buffer for high-throughput stream processing.',
    language: 'rust',
    code: `pub struct RingBuffer<T> {
    buffer: Vec<Option<T>>,
    capacity: usize,
    head: usize,
    tail: usize,
    size: usize,
}

impl<T: Clone> RingBuffer<T> {
    pub fn new(capacity: usize) -> Self {
        Self {
            buffer: vec![None; capacity],
            capacity,
            head: 0,
            tail: 0,
            size: 0,
        }
    }

    pub fn push(&mut self, item: T) {
        self.buffer[self.tail] = Some(item);
        self.tail = (self.tail + 1) % self.capacity;
        if self.size < self.capacity {
            self.size += 1;
        } else {
            self.head = (self.head + 1) % self.capacity;
        }
    }
}`
  }
};

export const AI_DETECTOR_PRESETS = [
  {
    id: 'preset-human-1',
    name: 'Prefix Tree Trie Search',
    language: 'typescript' as ProgrammingLanguage,
    expectedType: 'Human',
    badge: 'Human Written',
    code: `// Handwritten Trie with search & startsWith
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd: boolean = false;
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string): void {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new TrieNode());
      }
      curr = curr.children.get(ch)!;
    }
    curr.isEnd = true;
  }

  search(word: string): boolean {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children.has(ch)) return false;
      curr = curr.children.get(ch)!;
    }
    return curr.isEnd;
  }
}`
  },
  {
    id: 'preset-ai-1',
    name: 'Explanatory LLM Binary Search',
    language: 'python' as ProgrammingLanguage,
    expectedType: 'AI',
    badge: 'AI Generated',
    code: `def binary_search(arr: list[int], target: int) -> int:
    """
    Performs a standard binary search algorithm on a sorted list of integers.

    Parameters:
    arr (list[int]): A list of sorted integers in ascending order.
    target (int): The integer value to find.

    Returns:
    int: The 0-based index of target if found; otherwise -1.
    """
    left = 0
    right = len(arr) - 1

    while left <= right:
        # Calculate middle index safely
        mid = left + (right - left) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`
  },
  {
    id: 'preset-mixed-1',
    name: 'Async Semaphore Concurrency Pool',
    language: 'typescript' as ProgrammingLanguage,
    expectedType: 'Mixed',
    badge: 'Mixed / Assisted',
    code: `export class AsyncSemaphore {
  private capacity: number;
  private queue: Array<() => void> = [];

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  async acquire(): Promise<() => void> {
    if (this.capacity > 0) {
      this.capacity--;
      return () => this.release();
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => resolve(() => this.release()));
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.capacity++;
    }
  }
}`
  }
];
