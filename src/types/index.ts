export interface User {
  id: number
  name: string
  email: string
  password?: string
  role: string
  created_at: string
}

export interface Project {
  id: number
  name: string
  description?: string
  user_id: number
  created_at: string

  role?: string
}

export interface Task {
  id: number
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'DONE' | string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string
  project_id: number
  created_at: string

  assigned_to?: string | number | null
  assignee_name?: string
}

//tabele de legatura

export interface ProjectMember {
  project_id: number
  user_id: number
  role: string
  added_at: string

  name?: string
  email?: string

  user?: User
}

export interface TaskAssignee {
  task_id: number
  user_Id: number

  user?: User
}

export interface ProjectDetails extends Project {
  members?: ProjectMember[]
  tasks?: Task[]
}
