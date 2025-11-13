export default function PhotosPage() {
  return (
    <form action="/api/upload" method="post" encType="multipart/form-data">
      <input type="file" name="file" accept="image/*" required />
      <button type="submit">Upload</button>
    </form>
  );
}
