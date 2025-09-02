"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useKeywordPermission from "@/hooks/useKeywordPermission";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebaseClient";
import styles from "./page.module.scss";

export default function KeywordManager() {
  const router = useRouter();
  const allowed = useKeywordPermission();
  const [site, setSite] = useState("megagong");
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [drag, setDrag] = useState(null);
  const [site, setSite] = useState("megagong");

  useEffect(() => {
    if (allowed === false) router.replace("/");
  }, [allowed, router]);

  useEffect(() => {
    if (allowed !== true || !db) return;
    const unsub = onSnapshot(doc(db, "keywords", site), async (snap) => {
      const list = snap.data()?.list || [];
      const mapped = list.map((item) =>
        typeof item === "string" ? { keyword: item, color: "#000000" } : item
      );
      setKeywords(mapped);
      if (list.some((item) => typeof item === "string")) {
        await setDoc(doc(db, "keywords", site), { list: mapped });
      }
    });
    return () => unsub();
  }, [allowed, site]);

  if (allowed !== true) return null;

  const update = async (arr) => {
    if (!db) return;
    await setDoc(doc(db, "keywords", site), { list: arr });
  };

  const add = async () => {
    const value = newKeyword.trim();
    if (!value) return;
    const item = { keyword: value, color: newColor };
    const arr = [...keywords, item];
    await update(arr);
    setNewKeyword("");
    setNewColor("#000000");
  };

  const remove = async (index) => {
    const arr = [...keywords];
    arr.splice(index, 1);
    await update(arr);
  };

  const changeColor = async (index, color) => {
    const arr = [...keywords];
    const item = arr[index];
    arr[index] =
      typeof item === "string" ? { keyword: item, color } : { ...item, color };
    setKeywords(arr);
    await update(arr);
  };

  const onDragStart = (index) => {
    setDrag(index);
  };

  const onDrop = async (index) => {
    if (drag === null) return setDrag(null);
    const arr = [...keywords];
    const [moved] = arr.splice(drag, 1);
    arr.splice(index, 0, moved);
    setDrag(null);
    await update(arr);
  };

  const siteLabel = site === "megagong" ? "넥스트공무원" : "공단기";

  return (
    <div className={styles.container}>
      <h1>키워드 관리자</h1>
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabButton} ${
            site === "megagong" ? styles.activeTab : ""
          }`}
          onClick={() => setSite("megagong")}
        >
          넥스트공무원
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${
            site === "gong" ? styles.activeTab : ""
          }`}
          onClick={() => setSite("gong")}
        >
          공단기
        </button>
      </div>
      <div className={styles.groups}>
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>{siteLabel}</h2>
          <ul className={styles.list}>
            {keywords.map((kw, idx) => (
              <li
                key={kw.keyword}
                className={styles.item}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(idx)}
              >
                <div className={styles.keyword}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={kw.color || "#000000"}
                    onChange={(e) => changeColor(idx, e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.colorTextInput}
                    value={kw.color || "#000000"}
                    onChange={(e) => changeColor(idx, e.target.value)}
                  />
                  <span>{kw.keyword}</span>
                </div>
                <button className={styles.button} onClick={() => remove(idx)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.controls}>
            <input
              type="color"
              className={styles.colorInput}
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
            <input
              type="text"
              className={styles.colorTextInput}
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
            <input
              type="text"
              className={styles.keywordInput}
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="키워드 추가"
            />
            <button className={styles.button} onClick={add}>
              추가
            </button>
          </div>
        </div>
      </div>
      <Link href="/" className={`${styles.button} ${styles.backButton}`}>
        메인으로
      </Link>
    </div>
  );
}

