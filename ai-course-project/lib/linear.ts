export const LINEAR_ASSIGNED_QUERY = `
  query {
    viewer {
      assignedIssues(filter: { state: { type: { nin: ["completed", "cancelled"] } } }) {
        nodes {
          id
          title
          priority
          url
          dueDate
          state { name type }
          team { name }
        }
      }
    }
  }
`;

export interface LinearIssueState {
  name: string;
  type: string;
}

export interface LinearIssueTeam {
  name: string;
}

export interface LinearIssue {
  id: string;
  title: string;
  priority: number; // 0=none 1=urgent 2=high 3=medium 4=low
  url: string;
  dueDate: string | null; // "YYYY-MM-DD" or null
  state: LinearIssueState;
  team: LinearIssueTeam;
}

export interface LinearApiResponse {
  connected: boolean;
  issues: LinearIssue[];
}

export const STATE_TYPE_ORDER: Record<string, number> = {
  triage: 0,
  backlog: 1,
  unstarted: 2,
  started: 3,
};
