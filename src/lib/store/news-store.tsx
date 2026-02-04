"use client";

import React, { createContext, useContext, useState } from "react";
import { initialNews, type NewsPost } from "@/lib/mock-news";

interface NewsState {
  posts: NewsPost[];
  addPost: (post: Omit<NewsPost, "id" | "createdAt" | "updatedAt">) => void;
  updatePost: (
    id: string,
    post: Partial<Omit<NewsPost, "id" | "createdAt" | "updatedAt">>,
  ) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => NewsPost | undefined;
}

// ! Temporary in-memory store until database is connected.
// TODO Replace with database integration.

const NewsContext = createContext<NewsState | null>(null);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>(initialNews);

  const addPost = (post: Omit<NewsPost, "id" | "createdAt" | "updatedAt">) => {
    setPosts((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        ...post,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const updatePost = (
    id: string,
    post: Partial<Omit<NewsPost, "id" | "createdAt" | "updatedAt">>,
  ) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...post, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const getPost = (id: string) => posts.find((p) => p.id === id);

  return (
    <NewsContext.Provider
      value={{ posts, addPost, updatePost, deletePost, getPost }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNewsStore() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error("useNewsStore must be used within a NewsProvider");
  }
  return context;
}
