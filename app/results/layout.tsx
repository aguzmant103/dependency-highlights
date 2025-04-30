import { Metadata } from "next"

export const metadata: Metadata = {
  title: "UseTrace",
  description: "View projects that depend on a specific repository",
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 