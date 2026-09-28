import { Component } from "react";
import { ErrorState } from "./StatePanel";

export default class WorkspaceErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) return <ErrorState title="This page couldn’t be opened"
      description="Reload the workspace to try again. If this continues, contact your administrator."
      action={<button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload workspace</button>} />;
    return this.props.children;
  }
}
