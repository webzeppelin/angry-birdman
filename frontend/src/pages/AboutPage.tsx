/**
 * About Page
 *
 * System information and help content.
 */

export function AboutPage() {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="shadow-card mx-auto max-w-3xl rounded-lg bg-white p-8">
          <h1 className="font-display mb-6 text-4xl text-neutral-800">About Angry Birdman</h1>

          <div className="prose prose-lg max-w-none text-neutral-600">
            <p>
              Angry Birdman is a clan management system designed specifically for Angry Birds 2 clan
              administrators and members.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-neutral-800">Purpose</h2>
            <p>
              Managing an Angry Birds 2 clan can be time-consuming. Angry Birdman streamlines the
              process by providing tools to:
            </p>
            <ul>
              <li>Track Clan-vs-Clan battle results and performance</li>
              <li>Calculate advanced statistics like ratio scores</li>
              <li>Manage clan rosters and member status</li>
              <li>Analyze trends over time</li>
              <li>Make data-driven decisions about clan strategy</li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-neutral-800">Key Concepts</h2>

            <h3 className="mt-4 text-xl font-semibold text-neutral-800">Flock Power (FP)</h3>
            <p>
              Each player has a Flock Power multiplier that grows as they progress in the game. New
              players start around FP 50, while veterans can exceed FP 4,000.
            </p>

            <h3 className="mt-4 text-xl font-semibold text-neutral-800">Ratio Score</h3>
            <p>
              The ratio score normalizes performance across different FP levels:
              <br />
              <code className="rounded bg-neutral-100 px-2 py-1 text-sm">
                Ratio = (Score / FP) × 10
              </code>
              <br />
              This allows fair comparison between players of different skill levels.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-neutral-800">Getting Started</h2>
            <p>
              Browse existing clan data without an account, or sign in to manage your own
              clan&apos;s information.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-neutral-800">Technology</h2>
            <p>
              Built with React, TypeScript, and Tailwind CSS. Open source and available on GitHub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
