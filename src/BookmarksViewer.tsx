import Fuse from 'fuse.js';
import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

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

function renderBookmarks(nodes: BookmarkNode[], highlightedIdx: number): React.ReactElement {
	return (
		<StyledList>
			{nodes.map((node, idx) => (
				<StyledListItem key={node.id} $highlighted={idx === highlightedIdx}>
					<a href={node.url} target="_blank" rel="noopener noreferrer">{node.title || node.url}</a>
				</StyledListItem>
			))}
		</StyledList>
	);
}

const BookmarksViewer: React.FC = () => {
	const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [highlightedIdx, setHighlightedIdx] = useState(0);
	const searchInputRef = useRef<HTMLInputElement>(null);

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
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setHighlightedIdx(idx => (idx + 1) % filtered.length);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setHighlightedIdx(idx => (idx - 1 + filtered.length) % filtered.length);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const url = filtered[highlightedIdx]?.url;
				if (url) window.open(url, '_blank');
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
					{filtered.length ? renderBookmarks(filtered, highlightedIdx) : <EmptyState>No bookmarks match your search.</EmptyState>}
				</ListContainer>
			</div>
		</div>
	);
};

export default BookmarksViewer;

