'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, googleProvider, db } from '@/firebaseClient';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import styles from './AuthForm.module.scss';

export default function AuthForm({ mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await setDoc(
          doc(db, 'users', cred.user.uid),
          {
            email: cred.user.email,
            displayName: cred.user.displayName || '',
          },
          { merge: true }
        );
        // 원하면 로그인 후 이동
        // router.replace('/');
      } else {
        if (!email.toLowerCase().endsWith('@nextstudy.net')) {
          setError('자사 메일 계정으로만 회원가입이 가능합니다.');
          return;
        }
        if (password !== confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          return;
        }
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (nickname) {
          await updateProfile(cred.user, { displayName: nickname });
        }
        await setDoc(
          doc(db, 'users', cred.user.uid),
          {
            email: cred.user.email,
            displayName: nickname || cred.user.displayName || '',
          },
          { merge: true }
        );
        // 이메일 인증 관련 로직 전부 제거
        // 원하면 가입 후 이동
        // router.replace('/');
      }
    } catch (err) {
      setError(err?.message || '로그인/회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === 'signup' && (
            <input
              className={styles.input}
              type="password"
              placeholder="비밀번호 재확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          {mode === 'signup' && (
            <input
              className={styles.input}
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          )}
          <button type="submit" className={styles.submitButton}>
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {mode === 'signup' ? (
          <p className={styles.notice}>
            ※ 자사 메일(@nextstudy.net) 계정으로만 <br />
            회원가입이 가능합니다.
          </p>
        ) : (
          <p className={styles.notice}>
            ※ 자사 메일(@nextstudy.net) 계정으로만 <br />
            로그인이 가능합니다.
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {mode === 'login' ? (
          <p className={styles.switch}>
            계정이 없나요? <Link href="/signup">회원가입</Link>
          </p>
        ) : (
          <p className={styles.switch}>
            이미 계정이 있나요? <Link href="/login">로그인</Link>
          </p>
        )}
      </div>
    </>
  );
}
