"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { ReloadIcon } from "@radix-ui/react-icons"

interface CLILoadingProps {
  owner: string;
  repo: string;
}

export function CLILoading({ owner, repo }: CLILoadingProps) {
  const [messages, setMessages] = useState<string[]>([`🔍 Discovering packages in ${owner}/${repo}`]);
  const [dots, setDots] = useState("");

  // Subscribe to console messages
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(" ");
      if (message.includes("Found package:") || 
          message.includes("Found") || 
          message.includes("Searching for dependents") ||
          message.includes("Processing batch")) {
        setMessages(prev => [...prev.slice(-4), message]);
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="bg-solv-card border-solv-purple/20 p-8 max-w-2xl w-full">
        <div className="flex flex-col items-center space-y-6">
          <ReloadIcon className="h-8 w-8 animate-spin text-solv-purple" />
          <div className="font-mono text-sm bg-black/20 p-4 rounded-lg w-full space-y-2">
            {messages.map((message, i) => (
              <div 
                key={i} 
                className={`text-solv-lightPurple transition-opacity duration-200 ${
                  i === messages.length - 1 ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {message}{i === messages.length - 1 ? dots : ''}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 