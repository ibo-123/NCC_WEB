"use client";

import { useParams } from "next/navigation";
import { ResultsView } from "@/components/features/ResultsView.js";

export default function ContestResultsDetailPage() {
  const { id } = useParams();
  return <ResultsView contestIdProp={id} />;
}
