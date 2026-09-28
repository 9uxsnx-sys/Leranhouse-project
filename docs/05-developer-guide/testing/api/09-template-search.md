# Template: Search / Filter / Paginated List

Use this template when adding an endpoint that returns a **paginated, filterable, or searchable list** of resources.

---

## Examples

- Listing communities with search by name
- Listing courses filtered by category
- Listing users with role filter and pagination
- Searching discussions by title or content

---

## Checklist

### Happy Path
- [ ] List returns all resources with default pagination (200)
- [ ] List respects `page` and `limit` parameters
- [ ] Search query filters results by name/title
- [ ] Filter parameters work correctly (e.g., `?published=true`)
- [ ] Sort parameters work correctly (e.g., `?sort_by=name-asc`)

### Authz Boundary
- [ ] User from another org cannot see resources from that org
- [ ] (For filtered access) User can only see resources they have access to

### Error/Edge Cases
- [ ] Empty list returns 200 with empty array (not 404)
- [ ] Invalid page number (0 or negative) returns 422 or defaults to page 1
- [ ] Invalid sort field returns 422
- [ ] Invalid filter value returns 422
- [ ] Page beyond available results returns empty array

### Anonymous Access
- [ ] Anonymous can see public resources (filtered by published/public fields)
- [ ] Anonymous cannot see private/unpublished resources

---

## Router-Level Template

```python
class Test{Entity}List:
    """Tests for list/search/filter endpoints on {Entity}."""

    async def test_list_default_pagination(self, client):
        """Default pagination returns all resources."""
        with patch(
            "src.routers.{domain}.{module}.get_{entities}_by_org",
            new_callable=AsyncMock,
            return_value=[
                _mock_{entity}(id=1, name="First"),
                _mock_{entity}(id=2, name="Second"),
            ],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/page/1/limit/10"
            )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_search_by_name(self, client):
        """Search query filters by name."""
        with patch(
            "src.routers.{domain}.{module}.search_{entities}_by_name",
            new_callable=AsyncMock,
            return_value=[_mock_{entity}(name="Matching Result")],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/search?q=Matching"
            )
        assert response.status_code == 200
        data = response.json()
        assert all("Matching" in item["name"] for item in data)

    async def test_filter_by_boolean_field(self, client):
        """Filter parameter works for boolean fields like published."""
        with patch(
            "src.routers.{domain}.{module}.get_{entities}_by_org",
            new_callable=AsyncMock,
            return_value=[_mock_{entity}(**{f"{{'published': True}}" })],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/page/1/limit/10?published=true"
            )
        assert response.status_code == 200
        assert all(item["published"] is True for item in response.json())

    async def test_sort_by_name_asc(self, client):
        """Sort parameter orders results correctly."""
        with patch(
            "src.routers.{domain}.{module}.get_{entities}_by_org",
            new_callable=AsyncMock,
            return_value=[
                _mock_{entity}(name="A First"),
                _mock_{entity}(name="B Second"),
            ],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/page/1/limit/10?sort_by=name-asc"
            )
        assert response.status_code == 200
        names = [item["name"] for item in response.json()]
        assert names == sorted(names)

    async def test_empty_list_returns_empty_array(self, client):
        """No resources returns 200 with empty array, not 404."""
        with patch(
            "src.routers.{domain}.{module}.get_{entities}_by_org",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = await client.get(
                "/api/v1/{domain}/org/1/page/1/limit/10"
            )
        assert response.status_code == 200
        assert response.json() == []

    async def test_invalid_sort_field_returns_422(self, client):
        """Invalid sort parameter returns 422."""
        response = await client.get(
            "/api/v1/{domain}/org/1/page/1/limit/10?sort_by=invalid-field"
        )
        assert response.status_code == 422
