// SVG copy icon styled button with animation
import Fuse from 'fuse.js';
import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { Copy, Check, ExternalLink } from 'lucide-react';

// Type for a Chrome bookmark node
interface BookmarkNode {
	id: string;
	title: string;
	url?: string;
	children?: BookmarkNode[];
}

const EmptyState = styled.div`
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #b0b0b0;
	font-size: 1.1rem;
	font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
`;

const ListContainer = styled.div`
	height: 320px;
	min-height: 320px;
	max-height: 320px;
	overflow-y: auto;
	transition: height 0.2s;
	background: #f8fafc;
	border-radius: 14px;
	box-shadow: 0 2px 12px 0 rgba(60,60,60,0.07);
	padding: 1.2rem 1rem;
`;

const StyledList = styled.ul`
	list-style: none;
	margin: 0;
	padding-left: 0.5rem;
`;

interface StyledListItemProps {
	$highlighted?: boolean;
}
const StyledListItem = styled.li<StyledListItemProps>`
	margin: 0.3rem 0;
	font-size: 1.04rem;
	font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
	color: #222;
	background: ${({ $highlighted }) => $highlighted ? '#e0e7ff' : 'transparent'};
	border-radius: 6px;
	a {
		color: #2563eb;
		text-decoration: none;
		border-radius: 4px;
		padding: 2px 6px;
		transition: background 0.15s, color 0.15s;
		display: block;
		width: 100%;
		background: ${({ $highlighted }) => $highlighted ? '#e0e7ff' : 'transparent'};
		color: ${({ $highlighted }) => $highlighted ? '#1e293b' : '#2563eb'};
	}
`;

// Helper to detect internal Chrome/Edge URLs
const isInternalUrl = (url?: string) =>
	url?.startsWith('chrome://') || url?.startsWith('edge://');

interface RenderBookmarksProps {
	nodes: BookmarkNode[];
	highlightedIdx: number;
	copiedIdx: number | null;
	handleCopy: (e: React.MouseEvent, url: string, idx: number) => void;
	setCopiedIdx: React.Dispatch<React.SetStateAction<number | null>>;
	setHighlightedIdx: React.Dispatch<React.SetStateAction<number>>;
}

const Favicon = styled.img`
	width: 18px;
	height: 18px;
	margin-right: 0.7em;
	vertical-align: middle;
	border-radius: 3px;
	background: #f3f3f3;
	box-shadow: 0 0 0.5px #bbb;
`;

// Improved Chrome icon SVG (closer to official favicon)
const ChromeIcon = () => (
	<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="9" cy="9" r="9" fill="#fff" />
		<path d="M9 9L17.5 9C17.5 4.2533 13.7467 0.5 9 0.5C5.393 0.5 2.285 2.697 0.75 6.001L9 9Z" fill="#EA4335" />
		<path d="M9 9L0.75 6.001C-0.785 9.305 0.393 13.305 4.001 15.5C5.393 16.303 7.393 17.5 9 17.5V9Z" fill="#34A853" />
		<path d="M9 9V17.5C10.607 17.5 12.607 16.303 14 15.5C17.607 13.305 18.785 9.305 17.25 6.001L9 9Z" fill="#FBBC05" />
		<circle cx="9" cy="9" r="3.5" fill="#4285F4" stroke="#fff" strokeWidth="1" />
	</svg>
);

const IconButton = styled.button<{ $copied?: boolean }>`
  background: none;
  border: none;
  color: ${({ $copied }) => ($copied ? '#22c55e' : '#888')};
  margin-left: 0.5em;
  margin-right: 0.3em;
  cursor: pointer;
  font-size: 1.1em;
  vertical-align: middle;
  padding: 0;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s;
  svg {
    transition: transform 0.3s cubic-bezier(.4,2,.6,1), color 0.2s;
    transform: ${({ $copied }) => ($copied ? 'translateY(-6px) scale(1.2)' : 'none')};
  }
`;

const RenderBookmarks: React.FC<RenderBookmarksProps & { navMode: 'keyboard' | 'mouse', setNavMode: React.Dispatch<React.SetStateAction<'keyboard' | 'mouse'>> }> = ({ nodes, highlightedIdx, copiedIdx, handleCopy, setCopiedIdx, setHighlightedIdx, navMode, setNavMode }) => {
		const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
		useEffect(() => {
				const el = itemRefs.current[highlightedIdx];
				if (el) {
						el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				}
		}, [highlightedIdx]);
		return (
				<StyledList>
						{nodes.map((node, idx) => {
								const internal = isInternalUrl(node.url);
								// Chrome favicon resource
								const faviconUrl = node.url && !internal
									? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(node.url)}`
									: undefined;
								return (
										<StyledListItem
											key={node.id}
											$highlighted={idx === highlightedIdx}
											ref={el => { itemRefs.current[idx] = el; }}
											onMouseEnter={() => {
												if (navMode === 'mouse') setHighlightedIdx(idx);
											}}
											onMouseMove={() => {
												if (navMode !== 'mouse') setNavMode('mouse');
											}}
										>
												<a
													href={internal ? undefined : node.url}
													target={internal ? undefined : "_blank"}
													rel={internal ? undefined : "noopener noreferrer"}
													style={{ display: 'flex', alignItems: 'center', cursor: internal ? 'default' : undefined }}
												>
													{internal
														? <span style={{ display: 'inline-flex', marginRight: '0.7em' }}><ChromeIcon /></span>
														: faviconUrl && <Favicon src={faviconUrl} alt="" />}
													<span style={{ flex: 1 }}>{node.title || node.url}</span>
													<IconButton
														onClick={e => handleCopy(e, node.url!, idx)}
														title="Copy link"
														$copied={copiedIdx === idx}
														aria-label="Copy link"
													>
														{copiedIdx === idx ? (
															<Check size={18} strokeWidth={2.2} />
														) : (
															<Copy size={18} strokeWidth={2.2} />
														)}
													</IconButton>
													<IconButton
														onClick={e => {
															e.preventDefault();
															if (!node.url) return;
															if (internal) {
																navigator.clipboard.writeText(node.url);
																setCopiedIdx(idx);
																setTimeout(() => {
																	setCopiedIdx(null);
																	if (chrome && chrome.tabs && chrome.tabs.create) {
																		chrome.tabs.create({}, () => {});
																	} else {
																		window.open('', '_blank');
																	}
																}, 120);
															} else {
																window.open(node.url, '_blank');
															}
														}}
														title={internal ? "Launch new tab" : "Open bookmark"}
														aria-label={internal ? "Launch new tab" : "Open bookmark"}
													>
														<ExternalLink size={18} strokeWidth={2.2} />
													</IconButton>
												</a>
										</StyledListItem>
								);
						})}
				</StyledList>
		);
}

const BookmarksViewer: React.FC = () => {
	const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [highlightedIdx, setHighlightedIdx] = useState(0);
	const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
	const [navMode, setNavMode] = useState<'keyboard' | 'mouse'>('keyboard');
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Clipboard copy handler (mouse)
	const handleCopy = (e: React.MouseEvent, url: string, idx: number) => {
		e.preventDefault();
		doCopy(url, idx);
	};

	// Clipboard copy handler (shared)
	const doCopy = (url: string, idx: number) => {
		navigator.clipboard.writeText(url);
		setCopiedIdx(idx);
		setTimeout(() => setCopiedIdx(null), 700);
	};

	// Focus the search input when the popup opens
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInputRef.current) {
				searchInputRef.current.focus();
			}
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		// @ts-ignore
		if (chrome && chrome.bookmarks) {
			chrome.bookmarks.getTree((results: BookmarkNode[]) => {
				setBookmarks(results);
				setLoading(false);
			});
		} else {
			setLoading(false);
		}
	}, []);

	// Flatten bookmarks tree to a flat array of only bookmarks (with url)
	const flattenBookmarks = (nodes: BookmarkNode[]): BookmarkNode[] => {
		let result: BookmarkNode[] = [];
		nodes.forEach(node => {
			if (node.url) result.push(node);
			if (node.children) result = result.concat(flattenBookmarks(node.children));
		});
		return result;
	};

	const filterBookmarks = (nodes: BookmarkNode[], searchText: string): BookmarkNode[] => {
		if (!searchText) return nodes;
		const fuse = new Fuse(nodes, {
			keys: [
				{ name: 'title', weight: 0.7 },
				{ name: 'url', weight: 0.3 }
			],
			threshold: 0.4, // Lower is stricter, higher is fuzzier
			ignoreLocation: true,
			minMatchCharLength: 2,
		});
		return fuse.search(searchText).map(result => result.item);
	};

	// Only flatten the children of the root node (chrome.bookmarks.getTree returns [{...root, children: [...] }])
	const flatBookmarks = bookmarks.length > 0 && bookmarks[0].children
		? flattenBookmarks(bookmarks[0].children)
		: [];
	const filtered = filterBookmarks(flatBookmarks, search);

	// Reset highlight to first result when search/filter changes
	useEffect(() => {
		setHighlightedIdx(0);
	}, [search, filtered.length]);

	// Keyboard navigation: arrow keys and enter
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!filtered.length) return;
			setNavMode('keyboard');
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setHighlightedIdx(idx => idx < filtered.length - 1 ? idx + 1 : idx);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setHighlightedIdx(idx => idx > 0 ? idx - 1 : idx);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const node = filtered[highlightedIdx];
				if (!node) return;
				const url = node.url;
				if (!url) return;
				if (isInternalUrl(url)) {
					doCopy(url, highlightedIdx);
					setTimeout(() => {
						if (chrome && chrome.tabs && chrome.tabs.create) {
							chrome.tabs.create({}, () => {
								// Chrome will open the default new tab page (extensions like Momentum will work)
							});
						} else {
							window.open('','_blank');
						}
					}, 120); // 120ms delay to ensure clipboard write
				} else {
					window.open(url, '_blank');
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [filtered, highlightedIdx]);

	if (loading) return <div>Loading bookmarks...</div>;
	if (!bookmarks.length) return <div>No bookmarks found.</div>;

	return (
		<div style={{
			fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
			background: '#f1f5f9',
			minHeight: 0,
			minWidth: 0,
			height: 420,
			width: 370,
			margin: 0,
			padding: '1.2rem 1rem 1rem 1rem',
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start',
			borderRadius: 14,
			boxShadow: '0 2px 12px 0 rgba(60,60,60,0.07)',
		}}>
			<input
				ref={searchInputRef}
				tabIndex={0}
				type="text"
				placeholder="Search bookmarks..."
				value={search}
				onChange={e => setSearch(e.target.value)}
				style={{
					marginBottom: '1rem',
					width: '100%',
					maxWidth: 340,
					padding: '0.6rem 0.9rem',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
					fontSize: '1.08rem',
					fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
					background: '#fff',
					color: '#222',
					outline: 'none',
					boxSizing: 'border-box',
				}}
			/>
			<div style={{
				flex: 1,
				width: '100%',
				maxWidth: 340,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
			}}>
				<ListContainer>
					{filtered.length ? <RenderBookmarks nodes={filtered} highlightedIdx={highlightedIdx} copiedIdx={copiedIdx} handleCopy={handleCopy} setCopiedIdx={setCopiedIdx} setHighlightedIdx={setHighlightedIdx} navMode={navMode} setNavMode={setNavMode} /> : <EmptyState>No bookmarks match your search.</EmptyState>}
				</ListContainer>
			</div>
		</div>
	);
};

export default BookmarksViewer;

