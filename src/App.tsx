import { useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { HomePage } from "@/components/pages/HomePage"
import { ProfilePage } from "@/components/pages/ProfilePage"
import { TasksPage } from "@/components/pages/TasksPage"
import { RequestsPage } from "@/components/pages/RequestsPage"
import { DepartmentsPage } from "@/components/pages/master-data/DepartmentsPage"
import { PositionsPage } from "@/components/pages/master-data/PositionsPage"
import { LocationsPage } from "@/components/pages/master-data/LocationsPage"
import { PreferencesPage } from "@/components/pages/PreferencesPage"
import { PreferencesProvider } from "@/contexts/PreferencesContext"
import type { Page } from "@/types/navigation"

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home")

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage />
      case "profile":
        return <ProfilePage />
      case "tasks":
        return <TasksPage />
      case "group-tasks":
        return <TasksPage mode="group-tasks" />
      case "requests-active":
        return <RequestsPage status="active" />
      case "requests-completed":
        return <RequestsPage status="completed" />
      case "md-departments":
        return <DepartmentsPage />
      case "md-positions":
        return <PositionsPage />
      case "md-locations":
        return <LocationsPage />
      case "preferences":
        return <PreferencesPage />
    }
  }

  return (
    <PreferencesProvider>
      <AppLayout activePage={activePage} onNavigate={setActivePage}>
        {renderPage()}
      </AppLayout>
    </PreferencesProvider>
  )
}
