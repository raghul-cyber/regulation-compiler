import os
path = r"apps\api\app\api\routers\regulations.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_upload = """    # Validate file extension
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext == 'pdf':
        file_type = FileTypeEnum.pdf
    elif ext in ['htm', 'html']:
        file_type = FileTypeEnum.html
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and HTML files are supported."
        )

    # 1. Upload file to S3
    try:
        storage_path = storage_service.upload_file(file.file, file.filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload file")"""

new_upload = """    # Validate file extension
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext == 'pdf':
        file_type = FileTypeEnum.pdf
    elif ext in ['htm', 'html']:
        file_type = FileTypeEnum.html
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and HTML files are supported. Please upload a valid document."
        )

    # Validate file size (limit to 50MB to prevent memory bloat in processing)
    if hasattr(file, "size") and file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the maximum allowed size of 50MB."
        )

    # 1. Upload file to S3
    try:
        storage_path = storage_service.upload_file(file.file, file.filename, file.content_type)
    except Exception as e:
        import logging
        logging.error(f"Storage upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to securely store the regulation file. Please try again."
        )"""

content = content.replace(old_upload, new_upload)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Backend upload errors patched.")
