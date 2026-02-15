// frontend/src/pages/StatisticsPage.jsx - NEW FILE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useUser } from "../context/userContext";

dayjs.extend(relativeTime);

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { username } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    newsStats: [],
    totals: {},
    activeUsers: [],
    recentActivity: [],
    dailyViews: [],
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:5000/api/views/statistics",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

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

  const getActivityIcon = (type) => {
    switch (type) {
      case "view":
        return "👁️";
      case "like":
        return "👍";
      case "comment":
        return "💬";
      default:
        return "📊";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "view":
        return "info";
      case "like":
        return "danger";
      case "comment":
        return "primary";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading statistics...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate("/news")}>
            Back to News
          </Button>
        </Alert>
      </Container>
    );
  }

  const { newsStats, totals, activeUsers, recentActivity, dailyViews } = stats;

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
              <h4 className="mb-0">📊 News Statistics</h4>
              <small>Welcome, {username || "Guest"}</small>
            </div>
            <div>
              <Button
                variant="outline-light"
                size="sm"
                className="me-2"
                onClick={() => navigate("/news")}
              >
                News Feed
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => navigate("/admin")}
              >
                Admin
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {/* Overview Cards */}
        <Row className="mb-4">
          <Col md={6} lg={3} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="display-4 text-primary mb-2">📰</div>
                <h3 className="mb-0">{totals.total_news || 0}</h3>
                <p className="text-muted mb-0">Total News</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="display-4 text-info mb-2">👁️</div>
                <h3 className="mb-0">{totals.total_views || 0}</h3>
                <p className="text-muted mb-0">Total Views</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="display-4 text-danger mb-2">👍</div>
                <h3 className="mb-0">{totals.total_likes || 0}</h3>
                <p className="text-muted mb-0">Total Likes</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3} className="mb-3">
            <Card className="shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="display-4 text-success mb-2">💬</div>
                <h3 className="mb-0">{totals.total_comments || 0}</h3>
                <p className="text-muted mb-0">Total Comments</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* News Statistics Table */}
          <Col lg={8} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">📊 News Performance</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                  <Table hover responsive className="mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th style={{ width: "50px" }}>#</th>
                        <th>News</th>
                        <th className="text-center">👁️ Views</th>
                        <th className="text-center">👍 Likes</th>
                        <th className="text-center">💬 Comments</th>
                        <th className="text-center">👥 Unique</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsStats.map((news, index) => (
                        <tr
                          key={news.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/news/${news.id}`)}
                        >
                          <td>{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {news.image && (
                                <img
                                  src={getImageUrl(news.image)}
                                  alt={news.title}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    marginRight: "10px",
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              )}
                              <div>
                                <strong>{news.title}</strong>
                                <br />
                                <small className="text-muted">
                                  by {news.author} •{" "}
                                  {dayjs(news.created_at).fromNow()}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg="info">{news.views_count}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="danger">{news.likes_count}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="primary">{news.comments_count}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="success">{news.unique_viewers}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Most Active Users */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">🏆 Most Active Users</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover size="sm" className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>User</th>
                      <th className="text-center">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{user.name}</strong>
                        </td>
                        <td className="text-center">
                          <small>
                            {user.views}👁️ {user.likes}👍 {user.comments}💬
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">🕐 Recent Activity</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="p-3 border-bottom"
                      style={{ fontSize: "0.9rem" }}
                    >
                      <div className="d-flex align-items-center mb-1">
                        <Badge
                          bg={getActivityColor(activity.type)}
                          className="me-2"
                        >
                          {getActivityIcon(activity.type)}
                        </Badge>
                        <strong>{activity.user_name}</strong>
                      </div>
                      <div className="text-muted small">
                        {activity.type === "view" && "viewed"}
                        {activity.type === "like" && "liked"}
                        {activity.type === "comment" && "commented on"}{" "}
                        <em>{activity.news_title}</em>
                      </div>
                      <div className="text-muted small">
                        {dayjs(activity.activity_time).fromNow()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Daily Views Chart */}
        {dailyViews.length > 0 && (
          <Row className="mt-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">📈 Views Last 7 Days</h5>
                </Card.Header>
                <Card.Body>
                  <div
                    className="d-flex align-items-end justify-content-around"
                    style={{ height: "200px" }}
                  >
                    {dailyViews.map((day, index) => {
                      const maxCount = Math.max(
                        ...dailyViews.map((d) => d.count),
                      );
                      const heightPercent = (day.count / maxCount) * 100;
                      return (
                        <div
                          key={index}
                          className="text-center"
                          style={{ flex: 1 }}
                        >
                          <div
                            style={{
                              height: `${heightPercent}%`,
                              backgroundColor: "#0d6efd",
                              borderRadius: "4px 4px 0 0",
                              minHeight: "20px",
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                top: "-20px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                              }}
                            >
                              {day.count}
                            </span>
                          </div>
                          <small className="text-muted mt-2 d-block">
                            {dayjs(day.date).format("MMM D")}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </Container>
  );
}
