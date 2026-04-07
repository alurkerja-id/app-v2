import { useCallback, useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { HomePage } from "@/components/pages/HomePage"
import { NotificationsPage } from "@/components/pages/NotificationsPage"
import { ProfilePage } from "@/components/pages/ProfilePage"
import { TasksPage } from "@/components/pages/TasksPage"
import { RequestsPage } from "@/components/pages/RequestsPage"
import { InvitationsPage } from "@/components/pages/InvitationsPage"
import { LoginPage } from "@/components/pages/LoginPage"
import { WorkspacesPage } from "@/components/pages/WorkspacesPage"
import { DepartmentsPage } from "@/components/pages/master-data/DepartmentsPage"
import { PositionsPage } from "@/components/pages/master-data/PositionsPage"
import { LocationsPage } from "@/components/pages/master-data/LocationsPage"
import { PreferencesProvider } from "@/contexts/PreferencesContext"
import { Toaster } from "@/components/ui/sonner"
import type { Page } from "@/types/navigation"

const PAGE_PATHS: Record<Page, string> = {
  login: "/",
  workspaces: "/workspaces",
  invitations: "/invitations",
  home: "/home",
  profile: "/profile",
  notifications: "/notifications",
  tasks: "/tasks",
  "group-tasks": "/group-tasks",
  "requests-active": "/requests/active",
  "requests-completed": "/requests/completed",
  "md-departments": "/master-data/departments",
  "md-positions": "/master-data/positions",
  "md-locations": "/master-data/locations",
}

function getPageFromPathname(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/"
  const match = Object.entries(PAGE_PATHS).find(([, path]) => path === normalizedPath)
  return (match?.[0] as Page | undefined) ?? "home"
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>(() => getPageFromPathname(window.location.pathname))

  const navigate = useCallback((page: Page) => {
    setActivePage(page)
    const nextPath = PAGE_PATHS[page]
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/"
    if (currentPath !== nextPath) {
      window.history.pushState({}, "", nextPath)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setActivePage(getPageFromPathname(window.location.pathname))
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case "login":
        return <LoginPage onNavigate={navigate} />
      case "workspaces":
        return <WorkspacesPage onNavigate={navigate} />
      case "invitations":
        return <InvitationsPage onNavigate={navigate} />
      case "home":
        return <HomePage />
      case "profile":
        return <ProfilePage />
      case "notifications":
        return <NotificationsPage />
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
    }
  }

  return (
    <PreferencesProvider>
      {activePage === "login" || activePage === "workspaces" || activePage === "invitations" ? (
        renderPage()
      ) : (
        <AppLayout activePage={activePage} onNavigate={navigate}>
          {renderPage()}
        </AppLayout>
      )}
      <Toaster position="top-center" />
    </PreferencesProvider>
  )
}
