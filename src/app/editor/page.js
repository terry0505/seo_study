"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";

export default function EditorPage() {
  const [value, setValue] = useState("");
  return <RichTextEditor value={value} onChange={setValue} />;
}
