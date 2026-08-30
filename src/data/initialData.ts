import { User, Submission, ProgrammingLanguage } from '../types';

export const PRIMARY_OWNER_USER: User = {
  id: 'user-owner',
  name: 'bigteggs26',
  email: 'bigteggs26@gmail.com',
  role: 'admin',
  isSuperAdmin: true,
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bigteggs26@gmail.com&backgroundColor=b6e3f4,c0aede,d1d4f9',
  title: 'Lead Administrator & Reviewer',
  badge: 'Super Admin',
  authProvider: 'google',
};

// Initial users array containing only the primary Super Admin account
export const INITIAL_USERS: User[] = [PRIMARY_OWNER_USER];

// Clean slate submissions
export const INITIAL_SUBMISSIONS: Submission[] = [];

// Helpful language boilerplate templates for when submitting code
export const CODE_TEMPLATES: Record<ProgrammingLanguage, string> = {
  typescript: `/**
 * Implementation
 */
export function exampleFunction<T>(items: T[]): T[] {
  return items.filter(Boolean);
}
`,
  javascript: `/**
 * Implementation
 */
export function exampleFunction(items) {
  return items.filter(Boolean);
}
`,
  python: `"""
Implementation
"""
def example_function(items: list) -> list:
    return [item for item in items if item]
`,
  java: `package com.example;

import java.util.List;
import java.util.stream.Collectors;

public class Solution {
    public static <T> List<T> filterItems(List<T> items) {
        return items.stream()
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toList());
    }
}
`,
  cpp: `#include <vector>
#include <algorithm>

template <typename T>
std::vector<T> filterItems(const std::vector<T>& items) {
    std::vector<T> result;
    for (const auto& item : items) {
        result.push_back(item);
    }
    return result;
}
`,
  rust: `pub fn filter_items<T: Clone>(items: &[T]) -> Vec<T> {
    items.iter().cloned().collect()
}
`,
  go: `package main

func FilterItems[T any](items []T) []T {
    result := make([]T, 0, len(items))
    for _, item := range items {
        result = append(result, item)
    }
    return result
}
`,
  sql: `-- Optimized Query
SELECT
    id,
    created_at,
    status
FROM submissions
WHERE status = 'pending'
ORDER BY created_at DESC;
`,
  html_css: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Component</title>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
  </div>
</body>
</html>
`
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
