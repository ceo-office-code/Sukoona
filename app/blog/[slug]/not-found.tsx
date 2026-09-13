import Link from "next/link";
export default function NotFound() {
  return <main id="main-content" className="journal-page"><div className="journal-intro"><p className="eyebrow">THE SUKOONA JOURNAL</p><h1>This story isn’t here.</h1><p>Find another thoughtful read in the journal.</p><Link className="text-link" href="/blog">Back to the journal</Link></div></main>;
}
