def read_binary_from_file_path(file_path: str) -> bytes:
    with open(file_path, 'rb') as file:
        return file.read()
