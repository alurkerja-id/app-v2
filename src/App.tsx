import { useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { HomePage } from "@/components/pages/HomePage"
import { TasksPage } from "@/components/pages/TasksPage"
import { RequestsPage } from "@/components/pages/RequestsPage"
import { AnalyticsPage } from "@/components/pages/AnalyticsPage"
import { HeatmapPage } from "@/components/pages/HeatmapPage"

type Page = "home" | "tasks" | "group-tasks" | "requests" | "analytics" | "heatmap"

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home")

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage />
      case "tasks":
        return <TasksPage />
      case "group-tasks":
        return <TasksPage mode="group-tasks" />
      case "requests":
        return <RequestsPage />
      case "analytics":
        return <AnalyticsPage />
      case "heatmap":
        return <HeatmapPage />
    }
  }

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </AppLayout>
  )
}
