// frontend/src/pages/newsPage.jsx - FIXED TAG COUNTS
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col, Alert, Button, Badge } from "react-bootstrap";
import NewsCard from "../components/newsCard";
import { fetchNews } from "../services/api/newsApi.js";
import { useUser } from "../context/userContext.jsx";

export default function NewsPage() {
  const { username } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [news, setNews] = useState([]);
  const [allNewsForTags, setAllNewsForTags] = useState([]); // NEW: Store all news for tag counting
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [allTags, setAllTags] = useState([]);

  // Refs to prevent multiple loads
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const observerTargetRef = useRef(null);
  const rowIndexRef = useRef(0);

  // Get tag from URL on mount
  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl) {
      setSelectedTag(tagFromUrl);
    }
  }, [searchParams]);

  // Fetch ALL news for tag counts (unfiltered)
  useEffect(() => {
    const fetchAllNewsForTags = async () => {
      try {
        // Fetch without tag filter to get all news for accurate counts
        const response = await fetch("http://localhost:5000/api/news/all");
        const allNews = await response.json();
        setAllNewsForTags(allNews);
      } catch (err) {
        console.error("Failed to fetch all news for tags:", err);
      }
    };

    fetchAllNewsForTags();
  }, []); // Only fetch once on mount

  // Extract unique tags from ALL news (not filtered)
  useEffect(() => {
    const tags = new Set();
    allNewsForTags.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tags.add(tag));
      }
    });
    setAllTags(Array.from(tags).sort());
  }, [allNewsForTags]);

  // Get last seen ID for pagination
  const getLastSeenId = () => {
    if (news.length === 0) return null;
    const oldestNews = [...news].sort((a, b) => a.id - b.id)[0];
    return oldestNews.id;
  };

  const loadMoreNews = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) {
      console.log("⏸️ Skipping load - already loading or no more items");
      return;
    }

    console.log("🔄 Loading more news...");
    isLoadingRef.current = true;
    setLoading(true);

    try {
      const lastSeenId = getLastSeenId();
      console.log("📤 Fetching with:", { lastSeenId, selectedTag });

      const newItems = await fetchNews(lastSeenId, selectedTag);
      console.log(`✅ Received ${newItems.length} items`);

      if (newItems.length === 0) {
        console.log("⏹️ No more items available");
        setHasMore(false);
        return;
      }

      // Filter out any duplicates
      const existingIds = new Set(news.map((item) => item.id));
      const uniqueNewItems = newItems.filter(
        (item) => !existingIds.has(item.id),
      );

      if (uniqueNewItems.length === 0 && newItems.length > 0) {
        console.log("⏹️ All items are duplicates, no more unique content");
        setHasMore(false);
        return;
      }

      console.log(`📥 Adding ${uniqueNewItems.length} unique items`);

      // Add new items and sort by ID descending (newest first)
      setNews((prev) => {
        const combined = [...prev, ...uniqueNewItems];
        return combined.sort((a, b) => b.id - a.id);
      });

      // If we got less than 3 items, we've reached the end
      if (newItems.length < 3) {
        console.log("⏹️ Received less than 3 items, reached end");
        setHasMore(false);
      }

      setError(null);
    } catch (err) {
      console.error("❌ Error loading news:", err);
      setError("Failed to load more news. Please try again.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [news, hasMore, selectedTag]);

  // Initial load
  useEffect(() => {
    const loadInitialNews = async () => {
      if (isMountedRef.current) return;

      console.log("🚀 Loading initial news...");
      isMountedRef.current = true;
      isLoadingRef.current = true;
      setLoading(true);

      try {
        const initialItems = await fetchNews(null, selectedTag);
        console.log(`✅ Initial load: ${initialItems.length} items`);

        if (initialItems.length > 0) {
          setNews(initialItems.sort((a, b) => b.id - a.id));
          setHasMore(initialItems.length === 3);
        } else {
          setHasMore(false);
        }

        setError(null);
      } catch (err) {
        console.error("❌ Error loading initial news:", err);
        setError("Failed to load news. Please try again.");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadInitialNews();
  }, [selectedTag]);

  // Reset when tag changes
  useEffect(() => {
    if (!isMountedRef.current) return;

    console.log(`🏷️ Tag changed to: ${selectedTag}`);
    rowIndexRef.current = 0;

    const resetAndLoad = async () => {
      setNews([]);
      setHasMore(true);
      setError(null);
      isLoadingRef.current = true;
      setLoading(true);

      try {
        const newItems = await fetchNews(null, selectedTag);
        console.log(`✅ New tag load: ${newItems.length} items`);

        if (newItems.length > 0) {
          setNews(newItems.sort((a, b) => b.id - a.id));
          setHasMore(newItems.length === 3);
        } else {
          setHasMore(false);
        }

        setError(null);
      } catch (err) {
        console.error("❌ Error loading news with tag:", err);
        setError("Failed to load news with this tag.");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    resetAndLoad();
  }, [selectedTag]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isLoadingRef.current) {
          console.log("👀 Bottom reached, loading more...");
          loadMoreNews();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    if (observerTargetRef.current) {
      observer.observe(observerTargetRef.current);
    }

    return () => {
      if (observerTargetRef.current) {
        observer.unobserve(observerTargetRef.current);
      }
    };
  }, [loading, hasMore, loadMoreNews]);

  // Scroll event listener as fallback
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - (scrollTop + clientHeight) < 100) {
        if (!loading && hasMore && !isLoadingRef.current) {
          console.log("📜 Scroll near bottom, loading...");
          loadMoreNews();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, loadMoreNews, news.length]);

  const handleRetry = () => {
    console.log("🔄 Retrying...");
    setHasMore(true);
    setError(null);
    isLoadingRef.current = false;
    loadMoreNews();
  };

  // Handle tag selection - updates URL
  const handleTagSelect = (tag) => {
    if (tag) {
      navigate(`/news?tag=${encodeURIComponent(tag)}`);
      setSelectedTag(tag);
    } else {
      navigate("/news");
      setSelectedTag(null);
    }
  };

  // Filter news by selected tag
  const filteredNews = selectedTag
    ? news.filter(
        (item) => Array.isArray(item.tags) && item.tags.includes(selectedTag),
      )
    : news;

  // Remove duplicates
  const uniqueNews = [
    ...new Map(filteredNews.map((item) => [item.id, item])).values(),
  ];

  // Group news into rows of 3
  const groupedNews = [];
  for (let i = 0; i < uniqueNews.length; i += 3) {
    groupedNews.push(uniqueNews.slice(i, i + 3));
  }

  // Get consistent tag counts from all news
  const getTagCount = (tag) => {
    return allNewsForTags.filter(
      (item) => Array.isArray(item.tags) && item.tags.includes(tag),
    ).length;
  };

  return (
    <Container fluid className="p-0" style={{ minHeight: "100vh" }}>
      {/* Top Bar */}
      <div className="bg-dark text-white p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">News Portal</h4>
            <small>Welcome, {username || "Guest"}</small>
          </div>
          <div>
            <Button
              variant="outline-light"
              size="sm"
              className="me-2"
              onClick={() => navigate("/admin")}
            >
              Admin
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => navigate("/statistics")}
            >
              Stats
            </Button>
          </div>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div
          className="bg-light p-3 border-bottom sticky-top"
          style={{ zIndex: 100 }}
        >
          <div className="d-flex flex-wrap gap-2">
            <Badge
              bg={!selectedTag ? "primary" : "light"}
              text={!selectedTag ? "light" : "dark"}
              className="px-3 py-2"
              style={{ cursor: "pointer" }}
              onClick={() => handleTagSelect(null)}
            >
              All News ({allNewsForTags.length})
            </Badge>
            {allTags.map((tag, index) => {
              const count = getTagCount(tag);
              return (
                <Badge
                  key={index}
                  bg={selectedTag === tag ? "primary" : "light"}
                  text={selectedTag === tag ? "light" : "dark"}
                  className="px-3 py-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleTagSelect(tag)}
                >
                  #{tag} ({count})
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <Container className="py-4">
        {/* Show current filter */}
        {selectedTag && (
          <Alert variant="info" className="mb-3">
            Filtering by tag: <strong>#{selectedTag}</strong>
            <Button
              variant="link"
              size="sm"
              onClick={() => handleTagSelect(null)}
              className="ms-2"
            >
              Clear filter
            </Button>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <Button variant="primary" onClick={handleRetry} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Display news in rows of 3 with fixed height */}
        {groupedNews.length === 0 && !loading ? (
          <div className="text-center py-5">
            <p className="text-muted">No news articles found.</p>
            {selectedTag && (
              <Button
                variant="outline-secondary"
                onClick={() => handleTagSelect(null)}
                className="mt-2"
              >
                Show All News
              </Button>
            )}
          </div>
        ) : (
          groupedNews.map((row, rowIndex) => (
            <Row
              key={rowIndex}
              className="mb-0"
              style={{
                minHeight: "70vh",
                height: "70vh",
                maxHeight: "70vh",
                borderBottom:
                  rowIndex < groupedNews.length - 1
                    ? "2px solid #e9ecef"
                    : "none",
              }}
            >
              {row.map((item) => (
                <Col xs={12} md={4} key={item.id}>
                  <div
                    style={{
                      height: "calc(70vh - 40px)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <NewsCard news={item} />
                  </div>
                </Col>
              ))}
              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, idx) => (
                  <Col xs={12} md={4} key={`empty-${idx}`}></Col>
                ))}
            </Row>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div
            className="text-center d-flex flex-column justify-content-center align-items-center"
            style={{ minHeight: "70vh", height: "70vh" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading next 3 news articles...</p>
          </div>
        )}

        {/* Observer target for infinite scroll */}
        <div ref={observerTargetRef} style={{ height: "1px" }} />

        {/* Manual load button */}
        {!loading && hasMore && uniqueNews.length > 0 && (
          <div className="text-center my-4">
            <Button
              variant="primary"
              onClick={loadMoreNews}
              className="px-5"
              disabled={loading}
            >
              Load Next 3 News
            </Button>
            <p className="text-muted mt-2 mb-0">
              Each click loads exactly 3 news articles
            </p>
          </div>
        )}

        {/* End of content message */}
        {!hasMore && uniqueNews.length > 0 && (
          <div
            className="text-center d-flex flex-column justify-content-center align-items-center"
            style={{ minHeight: "70vh", height: "70vh" }}
          >
            <div className="p-4 bg-light rounded">
              <p className="text-muted mb-2">You've reached the end!</p>
            </div>
          </div>
        )}
      </Container>
    </Container>
  );
}
