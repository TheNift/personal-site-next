'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GameConfirmationModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function GameConfirmationModal({
	isOpen,
	onConfirm,
	onCancel,
}: GameConfirmationModalProps) {
	const { strings } = useLanguage();

	const gameStrings = (
		strings as unknown as {
			game?: { confirmation?: { title?: string; yes?: string; no?: string } };
		}
	)?.game?.confirmation;
	const title = gameStrings?.title || 'Enter game?';
	const yesText = gameStrings?.yes || 'Yes';
	const noText = gameStrings?.no || 'No';

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!isOpen) return;
			if (e.key === 'Escape') {
				e.preventDefault();
				onCancel();
			} else if (e.key === 'Enter') {
				e.preventDefault();
				onConfirm();
			}
		},
		[isOpen, onCancel, onConfirm]
	);

	useEffect(() => {
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [isOpen, handleKeyDown]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
					onClick={onCancel}
					role="dialog"
					aria-modal="true"
					aria-label={title}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 8 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 8 }}
						transition={{ type: 'spring', damping: 25, stiffness: 350 }}
						className="relative w-full max-w-xs bg-[#14130d] border border-yorha/30 rounded-xl p-6 shadow-2xl font-jetbrains-mono text-yorha text-center space-y-5"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mx-auto w-12 h-12 rounded-full bg-yorha/10 border border-yorha/30 flex items-center justify-center text-yorha">
							<Gamepad2 size={24} />
						</div>

						<h2 className="text-lg font-bold text-yorha tracking-tight">
							{title}
						</h2>

						<div className="flex items-center justify-center gap-3 pt-1">
							<button
								type="button"
								onClick={onCancel}
								className="flex-1 py-2 px-4 rounded-lg border border-yorha/25 text-yorha/75 hover:text-yorha hover:bg-yorha/10 transition-colors text-sm font-semibold cursor-pointer"
							>
								{noText}
							</button>
							<button
								type="button"
								onClick={onConfirm}
								autoFocus
								className="flex-1 py-2 px-4 rounded-lg bg-yorha text-yorha-dark hover:bg-white transition-all text-sm font-bold shadow-[0_0_15px_rgba(209,205,183,0.25)] cursor-pointer"
							>
								{yesText}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
