"use client";
import Link from "next/link";
import { FormEvent, useState } from "react"; import {useRouter} from "next/navigation";
import { api, setAccessToken } from "@/lib/api";

export default function SignInPage(){
 const router=useRouter();
 const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setBusy(true);const data=new FormData(event.currentTarget);try{const session=await api<{accessToken:string}>('/auth/login',{method:'POST',body:JSON.stringify({email:data.get('email'),password:data.get('password')})});setAccessToken(session.accessToken);router.push('/painel');}catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar.');}finally{setBusy(false)}}
 return <main className="course-page"><div className="course-shell"><Link className="course-back" href="/">← Texto em Dados</Link><span className="section-kicker">ÁREA DO ESTUDANTE</span><h1>Entrar.</h1><p className="course-intro">Use sua conta para acompanhar tentativas e progresso entre sessões.</p><form className="account-form" onSubmit={submit}><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>{error&&<p role="alert" className="form-error">{error}</p>}<button className="button button-primary" disabled={busy}>{busy?'Entrando…':'Entrar'}</button></form><div className="account-links"><Link href="/cadastro">Criar conta</Link><Link href="/recuperar-senha">Esqueci minha senha</Link></div></div></main>
}
