// frontend/src/components/NewsCard.jsx - COMPLETE
import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { io } from "socket.io-client";
import { useUser } from "../context/userContext";
import CommentsModal from "./commentsModal";

dayjs.extend(relativeTime);

const socket = io("http://localhost:5000");

export default function NewsCard({ news }) {
  const navigate = useNavigate();
  const { username } = useUser();
  const [likeCount, setLikeCount] = useState(news?.likes_count || 0);
  const [commentCount, setCommentCount] = useState(news?.comments_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showComments, setShowComments] = useState(false);

  // Fetch or create user ID from backend
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

  const handleLikeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleCommentsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(true);
  };

  if (!news) return null;

  const tags = Array.isArray(news.tags) ? news.tags : [];

  const getImageUrl = () => {
    if (!news.image) return null;
    if (news.image.startsWith("http") || news.image.startsWith("/uploads")) {
      return news.image.startsWith("http")
        ? news.image
        : `http://localhost:5000${news.image}`;
    } else if (news.image.startsWith("uploads/")) {
      return `http://localhost:5000/${news.image}`;
    } else {
      return `http://localhost:5000/uploads/${news.image}`;
    }
  };

  const imageUrl = getImageUrl();

  return (
    <>
      <Card className="h-100">
        {imageUrl && (
          <Card.Img
            variant="top"
            src={imageUrl}
            style={{ height: "200px", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                '<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>';
            }}
          />
        )}

        <Card.Body className="d-flex flex-column">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-2">
              {tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} bg="light" text="dark" className="me-1">
                  #{tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge bg="secondary">+{tags.length - 2}</Badge>
              )}
            </div>
          )}

          <Card.Title>{news.title}</Card.Title>

          {news.caption && (
            <Card.Subtitle className="mb-2 text-muted">
              {news.caption}
            </Card.Subtitle>
          )}

          <Card.Text>
            {news.content.length > 150
              ? news.content.slice(0, 150) + "..."
              : news.content}
          </Card.Text>

          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="text-muted">
                {dayjs(news.created_at).fromNow()}
              </small>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant={isLiked ? "primary" : "outline-secondary"}
                  size="sm"
                  onClick={handleLikeToggle}
                  disabled={isLiking || !userId}
                  style={{
                    minWidth: "70px",
                    cursor: userId ? "pointer" : "not-allowed",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>👍</span> {likeCount}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleCommentsClick}
                  style={{ minWidth: "70px" }}
                >
                  <span style={{ fontSize: "16px" }}>💬</span> {commentCount}
                </Button>
              </div>
            </div>

            <Button
              variant="outline-primary"
              size="sm"
              className="w-100"
              onClick={() => navigate(`/news/${news.id}`)}
            >
              Read More
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Comments Modal */}
      <CommentsModal
        show={showComments}
        onHide={() => setShowComments(false)}
        newsId={news.id}
        newsTitle={news.title}
        userId={userId}
        userName={username}
      />
    </>
  );
}
