import { useState } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';

const ME = gql`
  query Me {
    me {
      id
      email
      name
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

const JOBS = gql`
  query Jobs {
    jobsConnection(first: 20) {
      edges {
        node {
          id
          title
          location
          remote
          company {
            name
          }
        }
      }
    }
  }
`;

const MY_APPLICATIONS = gql`
  query MyApplications {
    applications {
      id
      status
      job {
        id
        title
        company {
          name
        }
      }
    }
  }
`;

const APPLY = gql`
  mutation Apply($jobId: ID!) {
    createApplication(jobId: $jobId) {
      id
      status
    }
  }
`;

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [login, { loading, error }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      localStorage.setItem('jobboard_token', data.login.token);
      onLogin();
    },
    onError: () => {},
  });

  return (
    <form
      style={styles.card}
      onSubmit={(e) => {
        e.preventDefault();
        login({ variables: { email, password } });
      }}
    >
      <h2>Login</h2>
      <input
        style={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        style={styles.input}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button style={styles.button} disabled={loading}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
      {error && <p style={styles.error}>{error.message}</p>}
      <p style={styles.hint}>demo@example.com / password123</p>
    </form>
  );
}

function JobList({ appliedJobIds }) {
  const { data, loading, error } = useQuery(JOBS);
  const [apply, { error: applyError }] = useMutation(APPLY, {
    refetchQueries: [{ query: MY_APPLICATIONS }], // refresh list after applying
  });

  if (loading) return <p>Loading jobs…</p>;
  if (error) return <p style={styles.error}>{error.message}</p>;

  const jobs = data.jobsConnection.edges.map((e) => e.node);

  return (
    <section>
      <h2>Open roles</h2>
      {applyError && <p style={styles.error}>{applyError.message}</p>}
      {jobs.map((job) => {
        const applied = appliedJobIds.has(job.id);
        return (
          <div key={job.id} style={styles.card}>
            <strong>{job.title}</strong>
            <div style={styles.muted}>
              {job.company.name} · {job.location}
              {job.remote ? ' · Remote' : ''}
            </div>
            <button
              style={styles.button}
              disabled={applied}
              onClick={() => apply({ variables: { jobId: job.id } })}
            >
              {applied ? 'Applied ✓' : 'Apply'}
            </button>
          </div>
        );
      })}
    </section>
  );
}

function ApplicationList() {
  const { data, loading, error } = useQuery(MY_APPLICATIONS);

  if (loading) return <p>Loading applications…</p>;
  if (error) return <p style={styles.error}>{error.message}</p>;
  if (!data.applications.length) return <p>No applications yet — apply to a job above.</p>;

  return (
    <section>
      <h2>My applications</h2>
      {data.applications.map((app) => (
        <div key={app.id} style={styles.card}>
          <strong>{app.job.title}</strong>
          <div style={styles.muted}>
            {app.job.company.name} · <em>{app.status}</em>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('jobboard_token'));
  const apollo = useApolloClient();
  const { data: meData } = useQuery(ME, { skip: !token });
  const { data: appsData } = useQuery(MY_APPLICATIONS, { skip: !token });

  const logout = async () => {
    localStorage.removeItem('jobboard_token');
    await apollo.clearStore();
    setToken(null);
  };

  if (!token) {
    return (
      <div style={styles.wrap}>
        <h1>JobBoard</h1>
        <LoginForm onLogin={() => setToken(localStorage.getItem('jobboard_token'))} />
      </div>
    );
  }

  const appliedJobIds = new Set((appsData?.applications ?? []).map((a) => a.job.id));

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <h1>JobBoard</h1>
        <div>
          <span style={styles.muted}>{meData?.me?.email}</span>{' '}
          <button style={styles.button} onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <JobList appliedJobIds={appliedJobIds} />
      <ApplicationList />
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: '12px 0' },
  input: { display: 'block', width: '100%', padding: 8, margin: '8px 0', boxSizing: 'border-box' },
  button: { padding: '8px 16px', marginTop: 8, cursor: 'pointer' },
  muted: { color: '#666', fontSize: 14, margin: '4px 0' },
  error: { color: 'crimson' },
  hint: { color: '#888', fontSize: 13 },
};
