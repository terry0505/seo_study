"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function RichTextEditor({ value, onChange, ...props }) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}
