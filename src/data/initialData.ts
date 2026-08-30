import { User, Submission } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Elena Rostova',
    email: 'elena@teamdev.internal',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Staff Architect & Lead Reviewer',
    badge: 'Senior Reviewer',
  },
  {
    id: 'user-admin-2',
    name: 'Marcus Vance',
    email: 'marcus@teamdev.internal',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Principal Systems Engineer',
    badge: 'Code Master',
  },
  {
    id: 'user-member-1',
    name: 'Alex Rivera',
    email: 'alex.r@teamdev.internal',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    title: 'Full Stack Engineer',
    badge: 'Frontend Guru',
  },
  {
    id: 'user-member-2',
    name: 'Priya Patel',
    email: 'priya.p@teamdev.internal',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Backend Platform Engineer',
    badge: 'Algorithmic Star',
  },
  {
    id: 'user-member-3',
    name: 'Devon Hayes',
    email: 'devon.h@teamdev.internal',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    title: 'Junior Software Engineer',
    badge: 'Rising Dev',
  },
  {
    id: 'user-member-4',
    name: 'Kaito Tanaka',
    email: 'kaito.t@teamdev.internal',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    title: 'Distributed Systems Engineer',
    badge: 'Concurrency Ace',
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-101',
    memberId: 'user-member-1',
    memberName: 'Alex Rivera',
    memberAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    title: 'Debounce & Throttle Hook with Immediate Trigger Option',
    language: 'typescript',
    description: 'Custom React hook for debouncing high frequency inputs with cleanup on unmount and optional leading edge trigger.',
    submittedAt: '2026-08-27T14:30:00Z',
    status: 'reviewed',
    tags: ['React', 'Hooks', 'TypeScript', 'Performance'],
    aiDetection: {
      aiProbability: 24,
      classification: 'Likely Human Written',
      confidence: 'High',
      breakdown: {
        predictabilityScore: 32,
        verbosityScore: 28,
        structureUniformity: 36,
        heuristicEntropy: 78,
      },
      detectedSignals: ['Standard React hook lifecycle bindings', 'Concise closure structure'],
      humanSignals: ['Ref-based callback synchronization pattern', 'Idiomatic custom React hook mechanics', 'Sparse, purposeful commenting'],
      summary: 'Strong signals of human authorship with organic hook state management and realistic TypeScript closure patterns.',
      analyzedAt: '2026-08-27T14:31:00Z',
    },
    code: `import { useEffect, useRef, useCallback } from 'react';

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  immediate: boolean = false
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debounced = useCallback((...args: Parameters<T>) => {
    const callNow = immediate && !timeoutRef.current;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (!immediate) {
        callbackRef.current(...args);
      }
    }, delay);

    if (callNow) {
      callbackRef.current(...args);
    }
  }, [delay, immediate]);

  return debounced;
}`,
    review: {
      id: 'rev-101',
      submissionId: 'sub-101',
      reviewerId: 'user-admin-1',
      reviewerName: 'Elena Rostova',
      reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      score: 92,
      rubric: {
        correctness: 37,
        style: 28,
        efficiency: 27,
        total: 92,
      },
      feedbackText: 'Solid custom hook! The ref synchronization pattern prevents stale closures nicely. One missing detail is a dedicated unmount cleanup to avoid dangling timer leaks when the component unmounts mid-delay.',
      strengths: [
        'Well typed generic parameters for callback arguments',
        'Clean immediate/leading execution branch',
        'Good use of callback ref to avoid unnecessary re-creation of debounced wrapper'
      ],
      improvements: [
        'Add unmount cleanup effect to clear active timeouts',
        'Provide a cancel/flush imperative return handle for advanced use cases',
        'Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for isomorphic browser/Node safety'
      ],
      correctedCode: `import { useEffect, useRef, useCallback } from 'react';

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
}

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  immediate: boolean = false
): DebouncedFunction<T> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Guarantee cleanup on component unmount
  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  const flush = useCallback((...args: Parameters<T>) => {
    cancel();
    callbackRef.current(...(args.length ? args : (lastArgsRef.current || [] as any)));
  }, [cancel]);

  const debounced = useCallback((...args: Parameters<T>) => {
    lastArgsRef.current = args;
    const callNow = immediate && timeoutRef.current === null;

    cancel();

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (!immediate) {
        callbackRef.current(...args);
      }
    }, delay);

    if (callNow) {
      callbackRef.current(...args);
    }
  }, [delay, immediate, cancel]) as DebouncedFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}`,
      statusOutcome: 'reviewed',
      reviewedAt: '2026-08-27T16:45:00Z',
    },
  },
  {
    id: 'sub-102',
    memberId: 'user-member-2',
    memberName: 'Priya Patel',
    memberAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Sliding Window In-Memory Rate Limiter',
    language: 'python',
    description: 'Thread-safe sliding log rate limiter with microsecond timestamp granularity and memory eviction.',
    submittedAt: '2026-08-28T09:15:00Z',
    status: 'reviewed',
    tags: ['Python', 'Concurrency', 'Algorithms', 'Security'],
    aiDetection: {
      aiProbability: 18,
      classification: 'Likely Human Written',
      confidence: 'High',
      breakdown: {
        predictabilityScore: 25,
        verbosityScore: 16,
        structureUniformity: 24,
        heuristicEntropy: 85,
      },
      detectedSignals: ['Standard deque usage'],
      humanSignals: ['Direct threading.Lock synchronization', 'Minimalist, zero-fluff implementation without boilerplate docstrings'],
      summary: 'Compact, focused human-authored concurrency code with high structural entropy and no synthetic filler.',
      analyzedAt: '2026-08-28T09:16:00Z',
    },
    code: `import time
from collections import deque
import threading

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()
        self.lock = threading.Lock()

    def allow_request(self) -> bool:
        with self.lock:
            now = time.time()
            cutoff = now - self.window_seconds
            
            while self.requests and self.requests[0] <= cutoff:
                self.requests.popleft()
                
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                return True
            return False`,
    review: {
      id: 'rev-102',
      submissionId: 'sub-102',
      reviewerId: 'user-admin-2',
      reviewerName: 'Marcus Vance',
      reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      score: 96,
      rubric: {
        correctness: 39,
        style: 29,
        efficiency: 28,
        total: 96,
      },
      feedbackText: 'Super clean and idiomatic Python! Using monotonic clock is preferable over wall clock (time.time()) to guard against NTP adjustments. Added context manager support and monotonic time.',
      strengths: [
        'Optimal O(1) amortized queue eviction with collections.deque',
        'Thread safety guaranteed with threading.Lock context management',
        'Concise and easily readable implementation'
      ],
      improvements: [
        'Use time.monotonic() to guard against system clock shifts and leap seconds',
        'Provide remaining tokens / retry_after metadata in return tuple'
      ],
      correctedCode: `import time
from collections import deque
import threading
from typing import Tuple

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        if max_requests <= 0 or window_seconds <= 0:
            raise ValueError("max_requests and window_seconds must be positive numbers.")
            
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests = deque()
        self._lock = threading.Lock()

    def check(self) -> Tuple[bool, int, float]:
        """
        Returns: (is_allowed, remaining_quota, retry_after_seconds)
        """
        with self._lock:
            # Use monotonic clock to prevent systemic clock drift or NTP adjustments
            now = time.monotonic()
            cutoff = now - self.window_seconds
            
            while self._requests and self._requests[0] <= cutoff:
                self._requests.popleft()
                
            current_count = len(self._requests)
            if current_count < self.max_requests:
                self._requests.append(now)
                remaining = self.max_requests - current_count - 1
                return True, remaining, 0.0
                
            oldest_timestamp = self._requests[0]
            retry_after = max(0.0, (oldest_timestamp + self.window_seconds) - now)
            return False, 0, retry_after

    def allow_request(self) -> bool:
        allowed, _, _ = self.check()
        return allowed`,
      statusOutcome: 'reviewed',
      reviewedAt: '2026-08-28T11:20:00Z',
    },
  },
  {
    id: 'sub-103',
    memberId: 'user-member-3',
    memberName: 'Devon Hayes',
    memberAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    title: 'Async Retry with Exponential Backoff and Jitter',
    language: 'javascript',
    description: 'Utility helper to retry flaky network requests with backoff multiplier and randomized jitter.',
    submittedAt: '2026-08-29T10:00:00Z',
    status: 'needs_resubmission',
    tags: ['Async', 'JavaScript', 'Network', 'Reliability'],
    aiDetection: {
      aiProbability: 88,
      classification: 'Likely AI Generated',
      confidence: 'High',
      breakdown: {
        predictabilityScore: 92,
        verbosityScore: 84,
        structureUniformity: 89,
        heuristicEntropy: 15,
      },
      detectedSignals: [
        'Classic textbook while(attempts < maxRetries) LLM template',
        'Standard Math.pow(2, attempts) + Math.random() signature snippet',
        'Generic variable names (fn, err, waitTime)'
      ],
      humanSignals: [],
      lineHighlights: [
        { lineStart: 1, lineEnd: 1, reason: 'Canonical parameter signature found in LLM prompt outputs', severity: 'medium' },
        { lineStart: 11, lineEnd: 12, reason: 'Generic formulaic exponential delay computation', severity: 'high' }
      ],
      summary: 'High density of standard online tutorial patterns and textbook while-loop construction strongly indicate AI code generation.',
      analyzedAt: '2026-08-29T10:01:00Z',
    },
    code: `async function retryOperation(fn, maxRetries = 3, delay = 1000) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempts++;
      if (attempts >= maxRetries) {
        throw err;
      }
      let waitTime = delay * Math.pow(2, attempts) + Math.random() * 100;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}`,
    review: {
      id: 'rev-103',
      submissionId: 'sub-103',
      reviewerId: 'user-admin-1',
      reviewerName: 'Elena Rostova',
      reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      score: 64,
      rubric: {
        correctness: 26,
        style: 20,
        efficiency: 18,
        total: 64,
      },
      feedbackText: 'Good starting foundation, but several critical gaps need addressing before this can be merged to our shared library: Missing AbortSignal support, retry predicate to avoid retrying non-retryable 4xx HTTP errors, and max delay ceiling cap.',
      strengths: [
        'Simple async/await loop structure',
        'Basic exponential backoff logic'
      ],
      improvements: [
        'Add shouldRetry predicate function so 401/403/404 responses fail fast instead of hammering the server',
        'Enforce a maxDelay ceiling so exponential delays do not explode indefinitely',
        'Integrate AbortSignal support for caller cancellation'
      ],
      correctedCode: `/**
 * Retries an asynchronous operation with full-jitter exponential backoff.
 */
async function retryOperation(
  fn,
  {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    factor = 2,
    shouldRetry = (error) => true,
    signal,
  } = {}
) {
  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Operation aborted by caller', 'AbortError');
    }

    try {
      return await fn({ attempt });
    } catch (error) {
      attempt++;

      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate exponential backoff with full jitter
      const expDelay = Math.min(maxDelayMs, initialDelayMs * Math.pow(factor, attempt - 1));
      const jitteredDelay = Math.random() * expDelay;

      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, jitteredDelay);

        if (signal) {
          const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            reject(new DOMException('Operation aborted during backoff', 'AbortError'));
          };
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }
}`,
      statusOutcome: 'needs_resubmission',
      reviewedAt: '2026-08-29T12:30:00Z',
    },
  },
  {
    id: 'sub-104',
    memberId: 'user-member-4',
    memberName: 'Kaito Tanaka',
    memberAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    title: 'Concurrent Worker Pool with Graceful Cancellation',
    language: 'go',
    description: 'Go worker pool leveraging channels, context cancellation, and sync.WaitGroup for bounded task processing.',
    submittedAt: '2026-08-29T16:45:00Z',
    status: 'pending',
    tags: ['Go', 'Concurrency', 'Channels', 'WorkerPool'],
    aiDetection: {
      aiProbability: 56,
      classification: 'Mixed / AI Assisted',
      confidence: 'Medium',
      breakdown: {
        predictabilityScore: 60,
        verbosityScore: 50,
        structureUniformity: 58,
        heuristicEntropy: 45,
      },
      detectedSignals: [
        'Standard channel select loop structure',
        'Canonical Go context cancellation pattern'
      ],
      humanSignals: [
        'Explicit worker lifecycle encapsulation in struct methods',
        'Proper WaitGroup handling across goroutines'
      ],
      summary: 'Mixture of standard idiomatic Go concurrency boilerplate with custom struct coordination, indicating human direction with possible AI assistance.',
      analyzedAt: '2026-08-29T16:46:00Z',
    },
    code: `package pool

import (
	"context"
	"sync"
)

type Task func(ctx context.Context) error

type Pool struct {
	tasks   chan Task
	wg      sync.WaitGroup
	ctx     context.Context
	cancel  context.CancelFunc
	workers int
}

func New(ctx context.Context, workers int, queueSize int) *Pool {
	c, cancel := context.WithCancel(ctx)
	p := &Pool{
		tasks:   make(chan Task, queueSize),
		ctx:     c,
		cancel:  cancel,
		workers: workers,
	}
	p.start()
	return p
}

func (p *Pool) start() {
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go func() {
			defer p.wg.Done()
			for {
				select {
				case <-p.ctx.Done():
					return
				case task, ok := <-p.tasks:
					if !ok {
						return
					}
					_ = task(p.ctx)
				}
			}
		}()
	}
}

func (p *Pool) Submit(t Task) bool {
	select {
	case <-p.ctx.Done():
		return false
	case p.tasks <- t:
		return true
	}
}

func (p *Pool) Close() {
	p.cancel()
	close(p.tasks)
	p.wg.Wait()
}`,
  },
  {
    id: 'sub-105',
    memberId: 'user-member-1',
    memberName: 'Alex Rivera',
    memberAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    title: 'Thread-Safe Lockless LRU Cache in Rust',
    language: 'rust',
    description: 'High-throughput LRU cache using crossbeam epochs and atomic pointer references.',
    submittedAt: '2026-08-30T08:00:00Z',
    status: 'pending',
    tags: ['Rust', 'Concurrency', 'Memory', 'DataStructures'],
    aiDetection: {
      aiProbability: 94,
      classification: 'Likely AI Generated',
      confidence: 'High',
      breakdown: {
        predictabilityScore: 96,
        verbosityScore: 82,
        structureUniformity: 95,
        heuristicEntropy: 8,
      },
      detectedSignals: [
        'Overly naive lock wrapping around RwLock<HashMap> and RwLock<Vec>',
        'Sub-optimal remove(0) linear array shifts characteristic of LLM quick-fixes',
        'Textbook generic constraints and cloned values'
      ],
      humanSignals: [],
      lineHighlights: [
        { lineStart: 30, lineEnd: 32, reason: 'Inefficient O(N) array remove(0) commonly generated by basic AI models', severity: 'high' }
      ],
      summary: 'Code presents standard textbook Rust data structure templates with sub-optimal naive locking patterns typical of generative AI prompt completions.',
      analyzedAt: '2026-08-30T08:01:00Z',
    },
    code: `use std::collections::HashMap;
use std::sync::RwLock;

pub struct LruCache<K, V> {
    capacity: usize,
    map: RwLock<HashMap<K, V>>,
    order: RwLock<Vec<K>>,
}

impl<K: Clone + std::hash::Hash + Eq, V: Clone> LruCache<K, V> {
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            map: RwLock::new(HashMap::with_capacity(capacity)),
            order: RwLock::new(Vec::with_capacity(capacity)),
        }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let map = self.map.read().unwrap();
        if let Some(val) = map.get(key) {
            let mut order = self.order.write().unwrap();
            if let Some(pos) = order.iter().position(|x| x == key) {
                let k = order.remove(pos);
                order.push(k);
            }
            Some(val.clone())
        } else {
            None
        }
    }

    pub fn put(&self, key: K, value: V) {
        let mut map = self.map.write().unwrap();
        let mut order = self.order.write().unwrap();

        if map.contains_key(&key) {
            if let Some(pos) = order.iter().position(|x| x == &key) {
                order.remove(pos);
            }
        } else if map.len() >= self.capacity {
            if !order.is_empty() {
                let oldest = order.remove(0);
                map.remove(&oldest);
            }
        }

        order.push(key.clone());
        map.insert(key, value);
    }
}`,
  },
  {
    id: 'sub-106',
    memberId: 'user-member-2',
    memberName: 'Priya Patel',
    memberAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Optimized Batch Upsert and Audit Trigger',
    language: 'sql',
    description: 'PostgreSQL 16 CTE for bulk dimensional entity upserts with change-data-capture audit logging.',
    submittedAt: '2026-08-25T11:10:00Z',
    status: 'reviewed',
    tags: ['SQL', 'Postgres', 'Database', 'ETL'],
    aiDetection: {
      aiProbability: 12,
      classification: 'Likely Human Written',
      confidence: 'High',
      breakdown: {
        predictabilityScore: 15,
        verbosityScore: 20,
        structureUniformity: 18,
        heuristicEntropy: 92,
      },
      detectedSignals: [],
      humanSignals: [
        'Advanced Postgres xmax = 0 system column inspection',
        'Writable CTE chaining with dual insert operations',
        'Custom domain schema references'
      ],
      summary: 'Highly specialized database engineering logic featuring PostgreSQL-specific system internals rarely generated by generic AI assistants.',
      analyzedAt: '2026-08-25T11:11:00Z',
    },
    code: `WITH incoming_data (user_id, email, organization_id, tier, updated_at) AS (
  VALUES 
    ('u_1001'::text, 'alex@example.com'::text, 'org_99'::text, 'enterprise'::text, NOW()),
    ('u_1002'::text, 'priya@example.com'::text, 'org_99'::text, 'pro'::text, NOW())
),
upserted AS (
  INSERT INTO users (user_id, email, organization_id, tier, updated_at)
  SELECT user_id, email, organization_id, tier, updated_at FROM incoming_data
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    tier = EXCLUDED.tier,
    updated_at = EXCLUDED.updated_at
  RETURNING user_id, email, tier, (xmax = 0) AS is_inserted
)
INSERT INTO user_audit_logs (user_id, action, recorded_at)
SELECT user_id, CASE WHEN is_inserted THEN 'CREATE' ELSE 'UPDATE' END, NOW()
FROM upserted;`,
    review: {
      id: 'rev-106',
      submissionId: 'sub-106',
      reviewerId: 'user-admin-2',
      reviewerName: 'Marcus Vance',
      reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      score: 98,
      rubric: {
        correctness: 40,
        style: 29,
        efficiency: 29,
        total: 98,
      },
      feedbackText: 'Masterful use of PostgreSQL xmax inspection and writable CTEs for single-transaction atomic audit tracking. Exemplary production database code!',
      strengths: [
        'Atomic single-roundtrip execution',
        'Clever xmax = 0 check to distinguish insert vs update without extra query'
      ],
      improvements: [
        'Consider indexing user_audit_logs(user_id, recorded_at) for reporting queries'
      ],
      correctedCode: `-- Production Ready CTE Upsert with Deterministic Audit Logging
WITH incoming_data (user_id, email, organization_id, tier, updated_at) AS (
  VALUES 
    ('u_1001'::text, 'alex@example.com'::text, 'org_99'::text, 'enterprise'::text, CLOCK_TIMESTAMP()),
    ('u_1002'::text, 'priya@example.com'::text, 'org_99'::text, 'pro'::text, CLOCK_TIMESTAMP())
),
upserted AS (
  INSERT INTO users (user_id, email, organization_id, tier, updated_at)
  SELECT user_id, email, organization_id, tier, updated_at FROM incoming_data
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    tier = EXCLUDED.tier,
    updated_at = EXCLUDED.updated_at
  WHERE users.email IS DISTINCT FROM EXCLUDED.email
     OR users.tier IS DISTINCT FROM EXCLUDED.tier
  RETURNING user_id, email, tier, (xmax = 0) AS is_inserted
)
INSERT INTO user_audit_logs (user_id, action, recorded_at)
SELECT 
  user_id, 
  CASE WHEN is_inserted THEN 'CREATE'::audit_action ELSE 'UPDATE'::audit_action END, 
  CLOCK_TIMESTAMP()
FROM upserted;`,
      statusOutcome: 'reviewed',
      reviewedAt: '2026-08-25T14:00:00Z',
    }
  }
];

export const AI_DETECTOR_PRESETS: Array<{
  id: string;
  name: string;
  badge: string;
  expectedType: 'AI' | 'Human' | 'Mixed';
  language: string;
  description: string;
  code: string;
}> = [
  {
    id: 'ai-chatgpt-classic',
    name: 'ChatGPT / LLM Textbook Solution',
    badge: 'Expected: 95%+ AI',
    expectedType: 'AI',
    language: 'typescript',
    description: 'Classic LeetCode Trie with excessive obvious step comments, generic variable identifiers, and standardized docstrings.',
    code: `/**
 * Implementation of a Prefix Tree (Trie) in TypeScript.
 * Supports insert, search, and startsWith operations.
 */
class TrieNode {
  // Map of children nodes
  public children: Map<string, TrieNode>;
  // Flag indicating if this node marks end of word
  public isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

export class Trie {
  private root: TrieNode;

  /**
   * Initializes the Trie object.
   */
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word into the trie.
   * @param word The word to insert
   */
  public insert(word: string): void {
    let current = this.root;
    // Step 1: Iterate through each character
    for (const char of word) {
      // Check if character exists in children
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    // Step 2: Mark end of word
    current.isEndOfWord = true;
  }

  /**
   * Returns if the word is in the trie.
   */
  public search(word: string): boolean {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        return false; // Character not found
      }
      current = current.children.get(char)!;
    }
    return current.isEndOfWord;
  }
}`,
  },
  {
    id: 'human-production-code',
    name: 'Human Developer Production Logic',
    badge: 'Expected: <20% AI',
    expectedType: 'Human',
    language: 'typescript',
    description: 'Pragmatic backend billing dispatcher with custom domain abbreviations, telemetry hooks, and real-world fallback handling.',
    code: `// authn/authz handled upstream by gateway
export async function dispatchStripeWebhook(rawBody: Buffer, sig: string, ctx: AppContext) {
  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    ctx.logger.warn({ err }, 'Stripe webhook sig mismatch');
    return { status: 400, body: 'Bad signature' };
  }

  // TODO(@alex): remove legacy invoice.payment_succeeded handler after v4 migration
  switch (event.type) {
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.org_id;
      if (!orgId) {
        // Kludge: some early 2024 customers don't have org_id in metadata
        const customer = await stripeClient.customers.retrieve(sub.customer as string);
        return syncCustomerFallback(customer, sub, ctx);
      }
      await db.organization.update({
        where: { id: orgId },
        data: { tier: mapPriceToTier(sub.items.data[0]?.price.id), updatedAt: new Date() }
      });
      break;
    }
    default:
      ctx.logger.debug({ type: event.type }, 'Ignored stripe event');
  }

  return { status: 200, body: 'ok' };
}`,
  },
  {
    id: 'copilot-hybrid',
    name: 'Copilot Hybrid (Human + AI Assist)',
    badge: 'Expected: ~50-60% AI',
    expectedType: 'Mixed',
    language: 'python',
    description: 'Custom domain workflow with AI-assisted boilerplate validation functions and standard formatting.',
    code: `from typing import Dict, Any, List
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class DeploymentManifest:
    service_name: str
    replicas: int
    image_tag: str
    env_vars: Dict[str, str]

def validate_and_deploy(manifest: DeploymentManifest) -> bool:
    """
    Validates deployment parameters and submits job to orchestrator.
    """
    # Validate replica count
    if manifest.replicas < 1 or manifest.replicas > 50:
        logger.error(f"Invalid replica count: {manifest.replicas}")
        return False

    # Check image tag format
    if not manifest.image_tag or ":" in manifest.image_tag:
        logger.error(f"Malformed image tag: {manifest.image_tag}")
        return False

    # Execute deployment request
    try:
        response = send_orchestrator_rpc(
            service=manifest.service_name,
            count=manifest.replicas,
            tag=manifest.image_tag
        )
        return response.get("status") == "SUCCESS"
    except Exception as e:
        logger.exception("Failed to deploy service: %s", str(e))
        return False`,
  }
];

export const CODE_TEMPLATES: Record<string, { title: string; code: string; desc: string }> = {
  typescript: {
    title: 'Generic Type-Safe EventEmitter',
    desc: 'An event dispatcher with typed listener callbacks and unsubscribe handles.',
    code: `type Listener<T = any> = (data: T) => void;

export class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<Listener>>();

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);

    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener as Listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(\`Error in event listener for \${String(event)}:\`, err);
        }
      });
    }
  }
}`
  },
  python: {
    title: 'Memoized LRU Decorator with TTL Expiry',
    desc: 'Python decorator that caches function results with time-to-live invalidation.',
    code: `import time
from functools import wraps
from typing import Callable, Any, Dict, Tuple

def ttl_cache(ttl_seconds: float = 60.0, max_size: int = 128) -> Callable:
    def decorator(func: Callable) -> Callable:
        cache: Dict[Tuple, Tuple[Any, float]] = {}

        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            key = (args, tuple(sorted(kwargs.items())))
            now = time.monotonic()

            if key in cache:
                result, timestamp = cache[key]
                if now - timestamp < ttl_seconds:
                    return result
                del cache[key]

            result = func(*args, **kwargs)
            if len(cache) >= max_size:
                oldest_key = next(iter(cache))
                del cache[oldest_key]

            cache[key] = (result, now)
            return result

        return wrapper
    return decorator`
  },
  rust: {
    title: 'Thread-Safe Ring Buffer Channel',
    desc: 'Circular buffer queue with condition variable sync for producer-consumer workloads.',
    code: `use std::sync::{Arc, Mutex, Condvar};
use std::collections::VecDeque;

pub struct BoundedQueue<T> {
    capacity: usize,
    buffer: Mutex<VecDeque<T>>,
    not_full: Condvar,
    not_empty: Condvar,
}

impl<T> BoundedQueue<T> {
    pub fn new(capacity: usize) -> Arc<Self> {
        Arc::new(Self {
            capacity,
            buffer: Mutex::new(VecDeque::with_capacity(capacity)),
            not_full: Condvar::new(),
            not_empty: Condvar::new(),
        })
    }

    pub fn push(&self, item: T) {
        let mut buffer = self.buffer.lock().unwrap();
        while buffer.len() >= self.capacity {
            buffer = self.not_full.wait(buffer).unwrap();
        }
        buffer.push_back(item);
        self.not_empty.notify_one();
    }

    pub fn pop(&self) -> T {
        let mut buffer = self.buffer.lock().unwrap();
        while buffer.is_empty() {
            buffer = self.not_empty.wait(buffer).unwrap();
        }
        let item = buffer.pop_front().unwrap();
        self.not_full.notify_one();
        item
    }
}`
  }
};
