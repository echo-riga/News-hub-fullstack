// frontend/src/pages/NewsDetailsPage.jsx - NEW COMPONENT
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Spinner,
  Alert,
  Card,
} from "react-bootstrap";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { io } from "socket.io-client";
import { useUser } from "../context/userContext";
import CommentsModal from "../components/commentsModal";

dayjs.extend(relativeTime);

const socket = io("http://localhost:5000");

export default function NewsDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { username } = useUser();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // frontend/src/pages/NewsDetailsPage.jsx - ADD VIEW TRACKING
  // Add this useEffect after the fetch news details useEffect

  useEffect(() => {
    const trackView = async () => {
      if (!news || !userId) return;

      try {
        await fetch("http://localhost:5000/api/views/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newsId: news.id, userId }),
        });
        console.log("👁️ View tracked for news:", news.id);
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };

    trackView();
  }, [news, userId]);

  // Fetch or create user ID
  useEffect(() => {
    const initUser = async () => {
      try {
        const currentUsername =
          username || `Guest_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch(
          "http://localhost:5000/api/users/find-or-create",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: currentUsername }),
          },
        );

        const data = await response.json();
        setUserId(data.id);
      } catch (error) {
        console.error("Failed to get user ID:", error);
      }
    };

    initUser();
  }, [username]);

  // Fetch news details
  useEffect(() => {
    const fetchNewsDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/news/${id}`);

        if (!response.ok) {
          throw new Error("News not found");
        }

        const data = await response.json();
        setNews(data);
        setLikeCount(data.likes_count || 0);
        setCommentCount(data.comments_count || 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNewsDetails();
    }
  }, [id]);

  // Socket listeners for likes and comments
  useEffect(() => {
    if (!news || !userId) return;

    // Check if current user has liked this news
    socket.emit("check-like-status", { newsId: news.id, userId });

    const handleLikeStatus = ({ isLiked: liked }) => {
      setIsLiked(liked);
    };

    const handleLikeUpdate = ({ count }) => {
      setLikeCount(count);
    };

    const handleCommentUpdate = ({ count }) => {
      setCommentCount(count);
    };

    socket.on(`like-status-${news.id}`, handleLikeStatus);
    socket.on(`news-like-updated-${news.id}`, handleLikeUpdate);
    socket.on(`news-comment-updated-${news.id}`, handleCommentUpdate);

    return () => {
      socket.off(`like-status-${news.id}`, handleLikeStatus);
      socket.off(`news-like-updated-${news.id}`, handleLikeUpdate);
      socket.off(`news-comment-updated-${news.id}`, handleCommentUpdate);
    };
  }, [news, userId]);

  const handleLikeToggle = () => {
    if (!userId || isLiking) return;

    setIsLiking(true);

    if (isLiked) {
      socket.emit("unlike-news", { newsId: news.id, userId });
      setIsLiked(false);
    } else {
      socket.emit("like-news", { newsId: news.id, userId });
      setIsLiked(true);
    }

    setTimeout(() => setIsLiking(false), 300);
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http") || image.startsWith("/uploads")) {
      return image.startsWith("http") ? image : `http://localhost:5000${image}`;
    } else if (image.startsWith("uploads/")) {
      return `http://localhost:5000/${image}`;
    } else {
      return `http://localhost:5000/uploads/${image}`;
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading news...</p>
        </div>
      </Container>
    );
  }

  if (error || !news) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || "News not found"}</p>
          <Button variant="outline-danger" onClick={() => navigate("/news")}>
            Back to News
          </Button>
        </Alert>
      </Container>
    );
  }

  const imageUrl = getImageUrl(news.image);
  const tags = Array.isArray(news.tags) ? news.tags : [];

  return (
    <Container
      fluid
      className="p-0"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      {/* Top Navigation Bar */}
      <div className="bg-dark text-white p-3 mb-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => navigate("/news")}
                className="me-3"
              >
                ← Back to News
              </Button>
              <span className="ms-2">Welcome, {username || "Guest"}</span>
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
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Card className="shadow-sm">
              {/* Featured Image */}
              {imageUrl && (
                <Card.Img
                  variant="top"
                  src={imageUrl}
                  style={{
                    maxHeight: "500px",
                    objectFit: "cover",
                    width: "100%",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}

              <Card.Body className="p-4 p-md-5">
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mb-3">
                    {tags.map((tag, index) => (
                      <Badge key={index} bg="primary" className="me-2 mb-2">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="display-5 fw-bold mb-3">{news.title}</h1>

                {/* Caption */}
                {news.caption && (
                  <h5 className="text-muted mb-4">{news.caption}</h5>
                )}

                {/* Meta Info */}
                <div className="d-flex flex-wrap align-items-center text-muted mb-4 pb-4 border-bottom">
                  <div className="me-4 mb-2">
                    <strong>By:</strong> {news.author || "Unknown"}
                  </div>
                  <div className="me-4 mb-2">
                    <strong>Published:</strong>{" "}
                    {dayjs(news.created_at).format("MMMM D, YYYY")}
                  </div>
                  <div className="mb-2">
                    <small>({dayjs(news.created_at).fromNow()})</small>
                  </div>
                </div>

                {/* Engagement Buttons */}
                <div className="d-flex gap-3 mb-4 pb-4 border-bottom">
                  <Button
                    variant={isLiked ? "primary" : "outline-primary"}
                    onClick={handleLikeToggle}
                    disabled={isLiking || !userId}
                    className="d-flex align-items-center gap-2"
                  >
                    <span style={{ fontSize: "20px" }}>👍</span>
                    <span>
                      {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                    </span>
                  </Button>

                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowComments(true)}
                    className="d-flex align-items-center gap-2"
                  >
                    <span style={{ fontSize: "20px" }}>💬</span>
                    <span>
                      {commentCount}{" "}
                      {commentCount === 1 ? "Comment" : "Comments"}
                    </span>
                  </Button>
                </div>

                {/* Full Content */}
                <div className="article-content">
                  <div
                    style={{
                      fontSize: "1.1rem",
                      lineHeight: "1.8",
                      color: "#333",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {news.content}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate("/news")}
                    >
                      ← Back to All News
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setShowComments(true)}
                    >
                      Join the Discussion
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Related Tags Section */}
            {tags.length > 0 && (
              <Card className="mt-4 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">Related Topics</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        bg="light"
                        text="dark"
                        className="px-3 py-2"
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                        onClick={() => navigate(`/news?tag=${tag}`)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Comments Modal */}
      <CommentsModal
        show={showComments}
        onHide={() => setShowComments(false)}
        newsId={news.id}
        newsTitle={news.title}
        userId={userId}
        userName={username}
      />
    </Container>
  );
}
