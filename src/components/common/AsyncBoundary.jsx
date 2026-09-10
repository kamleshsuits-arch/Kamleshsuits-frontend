import { Component } from 'react';

export default class AsyncBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.optional) return null;
    return (
      <div role="alert" className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-primary">This page could not load</h1>
        <p className="mt-3 text-sm text-stone-600">Check your connection and try again.</p>
        <button onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-xl bg-primary px-6 py-3 text-white">Try again</button>
        <a href="/" className="mt-4 block text-sm underline">Return to home</a>
      </div>
    );
  }
}
