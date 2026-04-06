"use client";

export default function DesignCanvas() {
  return (
    <div className="designCanvas">
      <div className="canvasToolbar">
        <span className="canvasLabel">Design Canvas</span>
        <span className="canvasMuted">
          Full diagramming tools — shapes, arrows, text, swimlanes, and freehand drawing.
          Use it to sketch your system design or architecture.
        </span>
      </div>
      <div className="excalidrawWrap">
        <iframe
          src="https://embed.diagrams.net/?embed=1&ui=sketch&spin=1&proto=json&configure=1&noExitBtn=1&noSaveBtn=1"
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Design Canvas"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
