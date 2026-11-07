// Fetch one account's public activity from the GitHub GraphQL API and reduce it
// to the few numbers the carpet is woven from.

const QUERY = `query($login: String!) {
  user(login: $login) {
    login
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false,
                 orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes { languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
        edges { size node { name } } } }
    }
  }
}`;

export async function fetchProfile(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'git-carpet',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  if (!json.data.user) throw new Error(`no GitHub user named ${login}`);
  return summarize(json.data.user);
}

export function summarize(user) {
  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount));
  let longestStreak = 0;
  let run = 0;
  for (const c of days) {
    run = c > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  const bytes = {};
  for (const repo of user.repositories.nodes) {
    for (const { size, node } of repo.languages.edges) bytes[node.name] = (bytes[node.name] || 0) + size;
  }
  const languages = Object.keys(bytes).sort((a, b) => bytes[b] - bytes[a] || a.localeCompare(b)).slice(0, 5);
  return {
    login: user.login,
    createdAt: user.createdAt,
    total: cal.totalContributions,
    longestStreak,
    weeks: cal.weeks.map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0)),
    languages,
  };
}
