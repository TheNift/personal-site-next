"use client";
import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import { Html } from '@react-three/drei';
import ScrambleText from '@/components/ScrambleText';
import emailjs from '@emailjs/browser';
import ReCAPTCHA from 'react-google-recaptcha';
import type { CSSProperties } from 'react';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const FIREFOX_USER_AGENT_REGEX = /firefox/i;

const FIREFOX_HTML_STYLE: CSSProperties = {
	backfaceVisibility: 'visible',
	transformStyle: 'preserve-3d',
	willChange: 'transform, opacity',
	contain: 'layout paint',
	outline: '1px solid transparent',
};
const DEFAULT_HTML_STYLE: CSSProperties = {
	backfaceVisibility: 'hidden',
};

const FIREFOX_FIELD_STYLE: CSSProperties = {
	transform: 'translateZ(0)',
	backfaceVisibility: 'visible',
	caretColor: 'transparent',
};

function applyFirefoxHtmlWrapperStyles(root: HTMLDivElement | null): () => void { // unfortunately needs to be done to fix Firefox's repaint behavior on input focus
	if (!root) return () => {};

	const inner = root.parentElement;
	const outer = inner?.parentElement;
	const host = outer?.parentElement;

	const nodes = [inner, outer, host].filter(Boolean) as HTMLElement[];
	const previousStyleText = new Map<HTMLElement, string>();
	nodes.forEach((node) => previousStyleText.set(node, node.style.cssText));

	if (inner) {
		inner.style.backfaceVisibility = 'visible';
		inner.style.transformStyle = 'preserve-3d';
	}
	if (outer) {
		outer.style.backfaceVisibility = 'visible';
		outer.style.transformStyle = 'preserve-3d';
	}
	if (host) {
		host.style.overflow = 'visible';
		host.style.contain = 'layout paint';
	}

	return () => {
		previousStyleText.forEach((cssText, node) => {
			node.style.cssText = cssText;
		});
	};
}

export function ContactForm3D() {
	const { strings } = useLanguage();
	const [isVisible, setIsVisible] = useState(false);
	const [isFirefox] = useState(
		() =>
			typeof navigator !== 'undefined' &&
			FIREFOX_USER_AGENT_REGEX.test(navigator.userAgent)
	);
	const [isSending, setIsSending] = useState(false);
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const form = useRef<HTMLFormElement>(null);
	const htmlRootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const triggerResize = () => {
			window.dispatchEvent(new Event('resize'));
		};

		const timer1 = setTimeout(triggerResize, 100);
		const timer2 = setTimeout(() => {
			triggerResize();
			setIsVisible(true);
		}, 600);

		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
		};
	}, []);

	useEffect(() => {
		if (!isFirefox || !htmlRootRef.current) return;
		return applyFirefoxHtmlWrapperStyles(htmlRootRef.current);
	}, [isFirefox, isVisible]);

	const htmlClassName = `w-[300px] h-[550px] bg-black p-4 overflow-y-auto select-none overflow-x-hidden relative ${
		isFirefox ? '' : 'transition-opacity duration-700'
	} ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
	const htmlStyle = isFirefox ? FIREFOX_HTML_STYLE : DEFAULT_HTML_STYLE;
	const firefoxFieldStyle = isFirefox ? FIREFOX_FIELD_STYLE : undefined;

	const sendEmail = (e: FormEvent) => {
		e.preventDefault();

		if (!form.current) return;

		if (!captchaToken) {
			alert('Please complete the reCAPTCHA');
			return;
		}

		setIsSending(true);
		setStatus('idle');

		emailjs
			.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, {
				publicKey: PUBLIC_KEY,
			})
			.then(
				() => {
					setStatus('success');
					setIsSending(false);
					setCaptchaToken(null);
					if (form.current) form.current.reset();
					setTimeout(() => setStatus('idle'), 3000);
				},
				(error) => {
					console.error('FAILED...', error.text);
					setStatus('error');
					setIsSending(false);
				}
			);
	};

	return (
		<group position={[0.0, 0.0001, 0.0295]} rotation={[0, 0, 0]}>
			<Html
				ref={htmlRootRef}
				transform
				occlude
				scale={0.052}
				className={htmlClassName}
				style={htmlStyle}
			>
				<div
					className="flex flex-col gap-6 h-full text-yorha"
					onPointerDown={(e) => e.stopPropagation()}
				>
					<h2 className="text-2xl font-bold font-jetbrains-mono text-center mb-2">
						<ScrambleText
							playOnMount={false}
							delay={300}
							scramble={3}
							step={2}
							speed={0.6}
						>
							{strings.contact.title}
						</ScrambleText>
					</h2>
					<form
						ref={form}
						className="flex flex-col gap-4 text-xs"
						onSubmit={sendEmail}
					>
						<div className="flex flex-col gap-1">
							<label
								htmlFor="name"
								className="text-yorha font-bold"
							>
								{strings.contact.form.name}
							</label>
							<input
								type="text"
								id="name"
								name="user_name"
								required
								className="bg-transparent border border-yorha text-yorha px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yorha"
								style={firefoxFieldStyle}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="email"
								className="text-yorha font-bold"
							>
								{strings.contact.form.email}
							</label>
							<input
								type="email"
								id="email"
								name="user_email"
								required
								className="bg-transparent border border-yorha text-yorha px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yorha"
								style={firefoxFieldStyle}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="subject"
								className="text-yorha font-bold"
							>
								{strings.contact.form.subject}
							</label>
							<input
								type="text"
								id="subject"
								name="subject"
								required
								className="bg-transparent border border-yorha text-yorha px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yorha"
								style={firefoxFieldStyle}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="message"
								className="text-yorha font-bold"
							>
								{strings.contact.form.message}
							</label>
							<textarea
								id="message"
								name="message"
								rows={6}
								required
								className="bg-transparent border border-yorha text-yorha px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-yorha"
								style={firefoxFieldStyle}
							/>
						</div>

						<div className="flex flex-col items-center gap-4">
							{RECAPTCHA_SITE_KEY && (
								<div>
									<label
										htmlFor="g-recaptcha-response"
										className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
									>
										reCAPTCHA verification
									</label>
									<ReCAPTCHA
										sitekey={RECAPTCHA_SITE_KEY}
										onChange={setCaptchaToken}
										theme="dark"
										className="transform scale-75 origin-center"
									/>
								</div>
							)}

							<div className="flex flex-row items-center justify-end w-full gap-2">
								<button
									type="submit"
									disabled={isSending}
									className={`align-self-end text-yorha-dark bg-yorha px-4 py-2 hover:cursor-pointer hover:bg-yorha/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
										isSending ? 'animate-pulse' : ''
									}`}
								>
									{isSending
										? 'Sending...'
										: strings.contact.form.submit}
								</button>
								{status === 'success' && (
									<span className="text-green-500 text-xs font-bold animate-pulse">
										Message Sent!
									</span>
								)}
								{status === 'error' && (
									<span className="text-red-500 text-xs font-bold">
										Failed to send.
									</span>
								)}
							</div>
						</div>

						<div className="text-[10px] text-yorha/60 text-center my-4 leading-tight">
							This site is protected by reCAPTCHA and the Google{' '}
							<a
								href="https://policies.google.com/privacy"
								target="_blank"
								rel="noreferrer"
								className="underline hover:text-yorha"
							>
								Privacy Policy
							</a>{' '}
							and{' '}
							<a
								href="https://policies.google.com/terms"
								target="_blank"
								rel="noreferrer"
								className="underline hover:text-yorha"
							>
								Terms of Service
							</a>{' '}
							apply.
						</div>
					</form>
				</div>
			</Html>
		</group>
	);
}
