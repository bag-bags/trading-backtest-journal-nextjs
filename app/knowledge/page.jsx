"use client";

import KnowledgeModal from "../components/KnowledgeModal";

export default function KnowledgePage() {
  return (
    <KnowledgeModal isOpen={true} onClose={() => { window.location.href = "/"; }} mode="page" />
  );
}
