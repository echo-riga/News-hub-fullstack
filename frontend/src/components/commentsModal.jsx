// frontend/src/components/CommentsModal.jsx - NEW COMPONENT
import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Form,
  ListGroup,
  Alert,
  Spinner,
} from "react-bootstrap";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { io } from "socket.io-client";

dayjs.extend(relativeTime);

const socket = io("http://localhost:5000");

export default function CommentsModal({
  show,
  onHide,
  newsId,
  newsTitle,
  userId,
  userName,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (!show || !newsId) return;

    console.log(`📡 Fetching comments for news ${newsId}`);
    setLoading(true);
    setError(null);

    // Fetch comments when modal opens
    socket.emit("fetch-comments", { newsId });

    // Listen for comments loaded
    const handleCommentsLoaded = ({ comments: loadedComments }) => {
      console.log(`✅ Loaded ${loadedComments.length} comments`);
      setComments(loadedComments);
      setLoading(false);
    };

    // Listen for new comments
    const handleNewComment = ({ comment, totalComments }) => {
      console.log(`✅ New comment added:`, comment);
      setComments((prev) => [comment, ...prev]);
    };

    // Listen for deleted comments
    const handleCommentDeleted = ({ commentId, totalComments }) => {
      console.log(`🗑️ Comment deleted:`, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    };

    // Listen for errors
    const handleError = ({ message }) => {
      console.error("❌ Comment error:", message);
      setError(message);
      setSubmitting(false);
    };

    socket.on(`comments-loaded-${newsId}`, handleCommentsLoaded);
    socket.on(`new-comment-${newsId}`, handleNewComment);
    socket.on(`comment-deleted-${newsId}`, handleCommentDeleted);
    socket.on("comment-error", handleError);

    return () => {
      socket.off(`comments-loaded-${newsId}`, handleCommentsLoaded);
      socket.off(`new-comment-${newsId}`, handleNewComment);
      socket.off(`comment-deleted-${newsId}`, handleCommentDeleted);
      socket.off("comment-error", handleError);
    };
  }, [show, newsId]);

  // Focus input when modal opens
  useEffect(() => {
    if (show && commentInputRef.current) {
      setTimeout(() => commentInputRef.current.focus(), 100);
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (!userId) {
      setError("You must be logged in to comment");
      return;
    }

    console.log(`💬 Submitting comment for news ${newsId}`);
    setSubmitting(true);
    setError(null);

    socket.emit("add-comment", {
      newsId,
      userId,
      comment: newComment.trim(),
    });

    // Clear input after submitting
    setNewComment("");
    setSubmitting(false);
  };

  const handleDelete = (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    console.log(`🗑️ Deleting comment ${commentId}`);
    socket.emit("delete-comment", { commentId, userId, newsId });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          💬 Comments
          <small
            className="text-muted d-block mt-1"
            style={{ fontSize: "0.9rem" }}
          >
            {newsTitle}
          </small>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Comment Form */}
        <Form onSubmit={handleSubmit} className="mb-4">
          <Form.Group>
            <Form.Control
              ref={commentInputRef}
              as="textarea"
              rows={3}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting || !userId}
            />
          </Form.Group>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">
              {userName ? `Posting as ${userName}` : "Please log in to comment"}
            </small>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || !newComment.trim() || !userId}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </Button>
          </div>
        </Form>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {comments.map((comment) => (
              <ListGroup.Item key={comment.id} className="px-0">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <strong className="me-2">{comment.user_name}</strong>
                      <small className="text-muted">
                        {dayjs(comment.created_at).fromNow()}
                      </small>
                    </div>
                    <p className="mb-0">{comment.comment}</p>
                  </div>
                  {userId === comment.user_id && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      className="ms-2"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      <Modal.Footer>
        <small className="text-muted me-auto">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </small>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
