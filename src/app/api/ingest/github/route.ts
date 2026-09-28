import { NextRequest, NextResponse } from 'next/server';
import { GitHubUserProfile, GitHubRepoItem } from '@/types/ingestion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'GitHub username is required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().replace(/^@/, '');

    // 1. Fetch User Profile
    const userRes = await fetch(`https://api.github.com/users/${cleanUsername}`, {
      headers: {
        'User-Agent': 'HuntFlow-CV-Ingest',
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 3600 },
    });

    if (!userRes.ok) {
      if (userRes.status === 404) {
        return NextResponse.json(
          { error: `GitHub user "${cleanUsername}" was not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: ${userRes.statusText}` },
        { status: userRes.status }
      );
    }

    const userData = await userRes.json();
    const userProfile: GitHubUserProfile = {
      login: userData.login,
      id: userData.id,
      name: userData.name,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      bio: userData.bio,
      location: userData.location,
      blog: userData.blog,
      company: userData.company,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
    };

    // 2. Fetch Repositories
    const reposRes = await fetch(
      `https://api.github.com/users/${cleanUsername}/repos?sort=updated&per_page=100`,
      {
        headers: {
          'User-Agent': 'HuntFlow-CV-Ingest',
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 },
      }
    );

    if (!reposRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch repositories for "${cleanUsername}".` },
        { status: reposRes.status }
      );
    }

    const reposData: any[] = await reposRes.json();

    // 3. Process & Sort Repositories
    // Non-fork repos prioritized, sorted by stars then update date
    const processedRepos: GitHubRepoItem[] = reposData.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      language: repo.language || null,
      topics: repo.topics || [],
      updated_at: repo.updated_at,
      is_fork: Boolean(repo.fork),
      is_selected: !repo.fork && repo.name !== `${cleanUsername}.github.io`,
      default_branch: repo.default_branch || 'main',
    }));

    // Prioritize non-forks, then top stars, then latest updated
    processedRepos.sort((a, b) => {
      if (a.is_fork !== b.is_fork) return a.is_fork ? 1 : -1;
      if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Select the top 6 repos by default for showcase
    const topRepos = processedRepos.filter((r) => !r.is_fork).slice(0, 6);
    topRepos.forEach((r) => (r.is_selected = true));

    // 4. Fetch README excerpts for top 6 selected repos in parallel
    await Promise.all(
      topRepos.map(async (repo) => {
        try {
          const branch = repo.default_branch || 'main';
          const readmeUrl = `https://raw.githubusercontent.com/${cleanUsername}/${repo.name}/${branch}/README.md`;
          const readmeRes = await fetch(readmeUrl, {
            headers: { 'User-Agent': 'HuntFlow-CV-Ingest' },
          });

          if (readmeRes.ok) {
            const readmeText = await readmeRes.text();
            // Truncate cleanly to first 1200 chars for concise high-signal summary
            repo.readme_summary = readmeText.slice(0, 1200).trim();
          } else {
            // Try master branch as fallback
            const masterUrl = `https://raw.githubusercontent.com/${cleanUsername}/${repo.name}/master/README.md`;
            const masterRes = await fetch(masterUrl, {
              headers: { 'User-Agent': 'HuntFlow-CV-Ingest' },
            });
            if (masterRes.ok) {
              const masterText = await masterRes.text();
              repo.readme_summary = masterText.slice(0, 1200).trim();
            }
          }
        } catch {
          // Non-blocking if a readme fails
          repo.readme_summary = null;
        }
      })
    );

    // Compute primary languages
    const langCounts: Record<string, number> = {};
    for (const r of processedRepos) {
      if (r.language) {
        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
      }
    }
    const primaryLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    return NextResponse.json({
      user: userProfile,
      repos: processedRepos,
      primaryLanguages,
      totalStars: processedRepos.reduce((acc, curr) => acc + curr.stargazers_count, 0),
    });
  } catch (error) {
    console.error('Error ingesting GitHub data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown internal error' },
      { status: 500 }
    );
  }
}
