"use client";

import React, { createContext, useContext, useState } from "react";
import { initialNews, type NewsPost } from "@/lib/mock-news";

interface NewsState {
  posts: NewsPost[];
  addPost: (post: Omit<NewsPost, "id" | "createdAt">) => void;
  updatePost: (
    id: string,
    post: Partial<Omit<NewsPost, "id" | "createdAt">>,
  ) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => NewsPost | undefined;
}

// ! Temporary in-memory store until database is connected.
// TODO Replace with database integration.

const NewsContext = createContext<NewsState | null>(null);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>(initialNews);
  const [nextId, setNextId] = useState(initialNews.length + 1);

  const addPost = (post: Omit<NewsPost, "id" | "createdAt">) => {
    const newPost = {
      id: nextId.toString(),
      ...post,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setNextId((prev) => prev + 1);
  };

  const updatePost = (
    id: string,
    post: Partial<Omit<NewsPost, "id" | "createdAt">>,
  ) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...post } : p)));
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
