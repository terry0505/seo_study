'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useKeywordPermission from '@/hooks/useKeywordPermission';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseClient';
import styles from './page.module.scss';

export default function KeywordManager() {
  const router = useRouter();
  const allowed = useKeywordPermission();
  const [gong, setGong] = useState([]);
  const [sobang, setSobang] = useState([]);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (allowed === false) router.replace('/');
  }, [allowed, router]);

  useEffect(() => {
    if (allowed !== true || !db) return;
    const ensureBlank = (arr) =>
      arr.length === 0 || arr[arr.length - 1].keyword !== ''
        ? [...arr, { keyword: '', color: '#000000' }]
        : arr;

    const unsubG = onSnapshot(doc(db, 'keywords', 'gong'), async (snap) => {
      const list = snap.data()?.list || [];
      const mapped = list.map((item) =>
        typeof item === 'string'
          ? { keyword: item, color: '#000000' }
          : item,
      );
      const withBlank = ensureBlank(mapped);
      setGong(withBlank);
      if (list.some((item) => typeof item === 'string')) {
        await setDoc(doc(db, 'keywords', 'gong'), { list: mapped });
      }
    });
    const unsubS = onSnapshot(doc(db, 'keywords', 'sobang'), async (snap) => {
      const list = snap.data()?.list || [];
      const mapped = list.map((item) =>
        typeof item === 'string'
          ? { keyword: item, color: '#000000' }
          : item,
      );
      const withBlank = ensureBlank(mapped);
      setSobang(withBlank);
      if (list.some((item) => typeof item === 'string')) {
        await setDoc(doc(db, 'keywords', 'sobang'), { list: mapped });
      }
    });
    return () => {
      unsubG();
      unsubS();
    };
  }, [allowed]);

  if (allowed !== true) return null;

  const update = async (group, arr) => {
    if (!db) return;
    const filtered = arr.filter((item) => item.keyword.trim() !== '');
    await setDoc(doc(db, 'keywords', group), { list: filtered });
  };

  const changeKeyword = (group, index, value) => {
    const arr = group === 'gong' ? [...gong] : [...sobang];
    arr[index] = { ...arr[index], keyword: value };
    if (group === 'gong') setGong(arr);
    else setSobang(arr);
  };

  const save = async (group) => {
    const arr = group === 'gong' ? [...gong] : [...sobang];
    await update(group, arr);
  };

  const remove = async (group, index) => {
    const arr = group === 'gong' ? [...gong] : [...sobang];
    arr.splice(index, 1);
    await update(group, arr);
  };

  const changeColor = async (group, index, color, save = true) => {
    const arr = group === 'gong' ? [...gong] : [...sobang];
    const item = arr[index];
    arr[index] =
      typeof item === 'string'
        ? { keyword: item, color }
        : { ...item, color };
    if (group === 'gong') setGong(arr);
    else setSobang(arr);
    if (save) await update(group, arr);
  };

  const onDragStart = (group, index) => {
    const arr = group === 'gong' ? gong : sobang;
    if (arr[index].keyword === '') return;
    setDrag({ group, index });
  };

  const onDrop = async (group, index) => {
    if (!drag || drag.group !== group) return setDrag(null);
    const arr = group === 'gong' ? [...gong] : [...sobang];
    const [moved] = arr.splice(drag.index, 1);
    arr.splice(index, 0, moved);
    setDrag(null);
    await update(group, arr);
  };

  return (
    <div className={styles.container}>
      <h1>키워드 관리자</h1>
      <div className={styles.groups}>
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>공무원</h2>
          <ul className={styles.list}>
          {gong.map((kw, idx) => (
            <li
              key={kw.keyword || idx}
              className={styles.item}
              draggable={kw.keyword !== ''}
              onDragStart={() => onDragStart('gong', idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop('gong', idx)}
            >
              <div className={styles.keyword}>
                <input
                  type='color'
                  className={styles.colorInput}
                  value={kw.color || '#000000'}
                  onChange={(e) =>
                    changeColor('gong', idx, e.target.value, kw.keyword !== '')
                  }
                />
                <input
                  type='text'
                  className={styles.colorTextInput}
                  value={kw.color || '#000000'}
                  onChange={(e) =>
                    changeColor('gong', idx, e.target.value, kw.keyword !== '')
                  }
                />
                {kw.keyword === '' ? (
                  <input
                    type='text'
                    className={styles.keywordInput}
                    value={kw.keyword}
                    onChange={(e) => changeKeyword('gong', idx, e.target.value)}
                    placeholder='키워드 입력'
                  />
                ) : (
                  <span>{kw.keyword}</span>
                )}
              </div>
              {kw.keyword === '' ? (
                <button
                  className={styles.button}
                  onClick={() => save('gong')}
                >
                  저장
                </button>
              ) : (
                <button
                  className={styles.button}
                  onClick={() => remove('gong', idx)}
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.group}>
        <h2 className={styles.groupTitle}>소방</h2>
        <ul className={styles.list}>
          {sobang.map((kw, idx) => (
            <li
              key={kw.keyword || idx}
              className={styles.item}
              draggable={kw.keyword !== ''}
              onDragStart={() => onDragStart('sobang', idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop('sobang', idx)}
            >
              <div className={styles.keyword}>
                <input
                  type='color'
                  className={styles.colorInput}
                  value={kw.color || '#000000'}
                  onChange={(e) =>
                    changeColor('sobang', idx, e.target.value, kw.keyword !== '')
                  }
                />
                <input
                  type='text'
                  className={styles.colorTextInput}
                  value={kw.color || '#000000'}
                  onChange={(e) =>
                    changeColor('sobang', idx, e.target.value, kw.keyword !== '')
                  }
                />
                {kw.keyword === '' ? (
                  <input
                    type='text'
                    className={styles.keywordInput}
                    value={kw.keyword}
                    onChange={(e) => changeKeyword('sobang', idx, e.target.value)}
                    placeholder='키워드 입력'
                  />
                ) : (
                  <span>{kw.keyword}</span>
                )}
              </div>
              {kw.keyword === '' ? (
                <button
                  className={styles.button}
                  onClick={() => save('sobang')}
                >
                  저장
                </button>
              ) : (
                <button
                  className={styles.button}
                  onClick={() => remove('sobang', idx)}
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      </div>
      <Link href='/' className={`${styles.button} ${styles.backButton}`}>
        메인으로
      </Link>
    </div>
  );
}

