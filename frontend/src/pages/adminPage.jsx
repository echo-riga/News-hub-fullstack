import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
  Tabs,
  Tab,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { adminNewsApi, tagsApi } from "../services/api/adminApi.js";

export default function AdminPage() {
  // News states
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Tags states
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // Modal states
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [deleteNewsId, setDeleteNewsId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    content: "",
    image: "",
    tags: [],
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // Load news
  const loadNews = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await adminNewsApi.getAllNews(pageNum, 10);
      setNews(data.news);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  // Load tags
  const loadTags = async () => {
    try {
      const data = await tagsApi.getTags();
      setTags(data);
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  };

  // Initial load
  useEffect(() => {
    loadNews();
    loadTags();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tag selection
  const handleTagToggle = (tagId) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId];
      return { ...prev, tags: newTags };
    });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Open modal for creating news
  const handleCreateNews = () => {
    setSelectedNews(null);
    setFormData({ title: "", caption: "", content: "", image: "", tags: [] });
    setSelectedFile(null);
    setShowNewsModal(true);
  };

  // Open modal for editing news
  const handleEditNews = async (newsItem) => {
    try {
      const data = await adminNewsApi.getNewsById(newsItem.id);
      setSelectedNews(data);
      setFormData({
        title: data.title,
        caption: data.caption || "",
        content: data.content,
        image: data.image || "",
        tags: data.tags || [],
      });
      setSelectedFile(null);
      setShowNewsModal(true);
    } catch (err) {
      setError("Failed to load news for editing");
    }
  };

  // Handle news submission
  const handleSubmitNews = async () => {
    try {
      const newsData = {
        title: formData.title,
        caption: formData.caption,
        content: formData.content,
        tags: formData.tags,
      };

      if (selectedFile) {
        newsData.image = selectedFile;
      } else if (formData.image) {
        newsData.image = formData.image;
      }

      if (selectedNews) {
        await adminNewsApi.updateNews(selectedNews.id, newsData);
      } else {
        await adminNewsApi.createNews(newsData);
      }

      setShowNewsModal(false);
      loadNews(page);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save news",
      );
    }
  };

  // Handle news deletion
  const handleDeleteNews = async () => {
    try {
      await adminNewsApi.deleteNews(deleteNewsId);
      setShowDeleteModal(false);
      loadNews(page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete news");
    }
  };

  // Handle tag creation
  const handleCreateTag = async () => {
    if (!newTag.trim()) return;

    try {
      await tagsApi.createTag(newTag.trim());
      setNewTag("");
      loadTags();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create tag");
    }
  };

  // Handle tag deletion
  const handleDeleteTag = async (tagId) => {
    if (!window.confirm("Delete this tag?")) return;

    try {
      await tagsApi.deleteTag(tagId);
      loadTags();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete tag");
    }
  };

  return (
    <Container fluid className="py-4">
      <h1>Admin Panel</h1>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs defaultActiveKey="news" className="mb-4">
        {/* News Tab */}
        <Tab eventKey="news" title="News">
          <div className="mb-3">
            <Button variant="primary" onClick={handleCreateNews}>
              Create News
            </Button>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>
                      {item.tags?.map((tag, i) => (
                        <Badge key={i} bg="secondary" className="me-1">
                          {tag}
                        </Badge>
                      ))}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditNews(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setDeleteNewsId(item.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => loadNews(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="mx-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => loadNews(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </Tab>

        {/* Tags Tab */}
        <Tab eventKey="tags" title="Tags">
          <div className="mb-4">
            <InputGroup>
              <FormControl
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <Button variant="primary" onClick={handleCreateTag}>
                Create Tag
              </Button>
            </InputGroup>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                bg="primary"
                className="px-3 py-2 d-flex align-items-center"
              >
                #{tag.name}
                <Button
                  variant="link"
                  className="text-light p-0 ms-2"
                  onClick={() => handleDeleteTag(tag.id)}
                  style={{ fontSize: "0.8rem" }}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </Tab>
      </Tabs>

      {/* News Modal */}
      <Modal
        show={showNewsModal}
        onHide={() => setShowNewsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedNews ? "Edit News" : "Create News"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Caption</Form.Label>
              <Form.Control
                type="text"
                name="caption"
                value={formData.caption}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control
                as="textarea"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={6}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    bg={
                      formData.tags.includes(tag.id) ? "primary" : "secondary"
                    }
                    className="px-3 py-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewsModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitNews}>
            {selectedNews ? "Update" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this news?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteNews}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
