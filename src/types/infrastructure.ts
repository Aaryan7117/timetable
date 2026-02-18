// Infrastructure Types

export interface Block {
  id: string;
  name: string;
  createdAt: number;
}

export interface Department {
  id: string;
  name: string;
  blockId: string;
  createdAt: number;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  departmentId: string;
  createdAt: number;
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
  departmentId: string;
  createdAt: number;
}

// Infrastructure State
export interface InfrastructureState {
  blocks: Block[];
  departments: Department[];
  classrooms: Classroom[];
  labs: Lab[];
}
