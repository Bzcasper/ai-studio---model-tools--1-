
import { DownloadDestination } from '../types';

const generateLocalHfScript = (repoId: string, filename: string, downloadDir: string) => {
    const requirements = `# To install dependencies:
# pip install huggingface-hub
huggingface-hub`;
    
    const code = `
from huggingface_hub import hf_hub_download
import os

# --- Configuration ---
# Hugging Face repository ID
REPO_ID = "${repoId}"
# The specific GGUF file to download
FILENAME = "${filename}"
# Local directory to save the model
DOWNLOAD_DIR = "${downloadDir}"

# --- Main download logic ---
def download_model():
    """
    Downloads the specified model from Hugging Face Hub.
    """
    print("--- GGUF Model Downloader (Hugging Face) ---")
    print(f"Repository: {REPO_ID}")
    print(f"File:       {FILENAME}")
    print(f"Destination:{DOWNLOAD_DIR}")
    print("---------------------------------------------")

    # Create the directory if it doesn't exist
    if not os.path.exists(DOWNLOAD_DIR):
        try:
            os.makedirs(DOWNLOAD_DIR)
            print(f"Created directory: {DOWNLOAD_DIR}")
        except OSError as e:
            print(f"❌ Error creating directory {DOWNLOAD_DIR}: {e}")
            return

    print(f"\\nStarting download...")
    try:
        # Download the model file
        local_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME,
            local_dir=DOWNLOAD_DIR,
            local_dir_use_symlinks=False,  # Recommended to download the actual file
            resume_download=True
        )
        print(f"\\n✅ Model downloaded successfully!")
        print(f"   -> Path: {local_path}")

    except Exception as e:
        print(f"\\n❌ An error occurred during download: {e}")
        print("   Please check the repository ID and filename.")

if __name__ == "__main__":
    download_model()
`;
  return { code: code.trim(), requirements: requirements.trim() };
};

const generateGoogleDriveHfScript = (repoId: string, filename: string, downloadDir: string, gdriveFolderName: string) => {
    const requirements = `huggingface-hub
google-api-python-client
google-auth-httplib2
google-auth-oauthlib
tqdm`;

    const code = `
import os
import io
from tqdm import tqdm

# Hugging Face import
from huggingface_hub import hf_hub_download

# Google imports
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaFileUpload
from googleapiclient.errors import HttpError

# ==================================================================================
# --- ⚙️ Configuration ---
# ==================================================================================
# Hugging Face repository ID
REPO_ID = "${repoId}"
# The specific GGUF file to download
FILENAME = "${filename}"
# Local directory to temporarily save the model before uploading
DOWNLOAD_DIR = "${downloadDir}"
# Google Drive folder name. If empty, saves to root 'My Drive'.
GDRIVE_FOLDER_NAME = "${gdriveFolderName}"
# This file is generated after you authenticate for the first time.
TOKEN_FILE = "token.json"
# Download this file from your Google Cloud Console.
CLIENT_SECRETS_FILE = "credentials.json"
# The scopes required for the script to access Google Drive.
SCOPES = ["https://www.googleapis.com/auth/drive.file"]


# ==================================================================================
# --- ⚠️ One-Time Setup: Google Drive API Credentials ---
# ==================================================================================
# 1. Go to https://console.cloud.google.com/ and create a new project.
# 2. In your project, search for "Google Drive API" and enable it.
# 3. Go to "APIs & Services" -> "Credentials".
# 4. Click "+ CREATE CREDENTIALS" -> "OAuth client ID".
# 5. Select "Desktop app" for the Application type and give it a name.
# 6. Click "CREATE". Then click "DOWNLOAD JSON" on the next screen.
# 7. Rename the downloaded file to "credentials.json" and place it in the
#    same directory as this Python script.
#
# You only need to do this once. The script will handle authentication from here.
# ==================================================================================


def get_gdrive_service():
    """Authenticates with Google and returns a service object for Google Drive."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception as e:
            print(f"Warning: Could not load token file. {e}")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Token refresh failed: {e}")
                creds = None
        if not creds:
            try:
                if not os.path.exists(CLIENT_SECRETS_FILE):
                    print("="*60)
                    print("❌ ERROR: 'credentials.json' not found.")
                    print("Please follow the one-time setup instructions in this script.")
                    print("="*60)
                    return None
                flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
            except Exception as e:
                print(f"Error during authentication flow: {e}")
                return None
        # Save the credentials for the next run
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    try:
        return build("drive", "v3", credentials=creds)
    except HttpError as error:
        print(f"An error occurred building the service: {error}")
        return None

def find_or_create_gdrive_folder(service, folder_name):
    """Finds a folder by name in Google Drive, creates it if it doesn't exist."""
    if not folder_name:
        return None  # Save to root 'My Drive'

    try:
        query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
        response = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        folders = response.get('files', [])
        
        if folders:
            print(f"Found folder '{folder_name}' with ID: {folders[0].get('id')}")
            return folders[0].get('id')
        else:
            print(f"Folder '{folder_name}' not found. Creating it...")
            file_metadata = {'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'}
            folder = service.files().create(body=file_metadata, fields='id').execute()
            print(f"Created folder with ID: {folder.get('id')}")
            return folder.get('id')
    except HttpError as error:
        print(f"An error occurred finding or creating the folder: {error}")
        return None

def upload_to_gdrive_with_progress(service, local_path, folder_id):
    """Uploads a local file to the specified Google Drive folder with a progress bar."""
    file_metadata = {'name': os.path.basename(local_path)}
    if folder_id:
        file_metadata['parents'] = [folder_id]

    file_size = os.path.getsize(local_path)
    
    print(f"\\nUploading {os.path.basename(local_path)} to Google Drive...")
    
    try:
        media = MediaFileUpload(local_path, resumable=True)
        
        request = service.files().create(body=file_metadata, media_body=media, fields='id')
        
        with tqdm(total=file_size, unit='B', unit_scale=True, unit_divisor=1024, desc="  Uploading") as pbar:
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    pbar.update(status.resumable_progress - pbar.n)
        
        print(f"\\n✅ File uploaded successfully to Google Drive.")

    except HttpError as error:
        print(f"\\n❌ An error occurred during upload: {error}")


def download_model_locally():
    """Downloads the model from Hugging Face to a local directory."""
    print("--- Step 1: Downloading model from Hugging Face ---")
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)

    try:
        local_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME,
            local_dir=DOWNLOAD_DIR,
            local_dir_use_symlinks=False,
            resume_download=True
        )
        print(f"\\n✅ Model downloaded successfully to temporary path: {local_path}")
        return local_path
    except Exception as e:
        print(f"\\n❌ An error occurred during download: {e}")
        return None


def main():
    """Main function to orchestrate the download and upload process."""
    # Step 1: Download the model file from Hugging Face
    local_model_path = download_model_locally()
    if not local_model_path:
        return

    # Step 2: Authenticate with Google Drive
    print("\\n--- Step 2: Authenticating with Google Drive ---")
    drive_service = get_gdrive_service()
    if not drive_service:
        print("Could not authenticate with Google Drive. Aborting.")
        return

    # Step 3: Find or create the destination folder on Google Drive
    print("\\n--- Step 3: Finding/Creating Google Drive Folder ---")
    destination_folder_id = find_or_create_gdrive_folder(drive_service, GDRIVE_FOLDER_NAME)
    # Continue even if folder_id is None (will save to root)

    # Step 4: Upload the file to Google Drive
    print("\\n--- Step 4: Uploading to Google Drive ---")
    upload_to_gdrive_with_progress(drive_service, local_model_path, destination_folder_id)

    # Step 5: Clean up the local file
    print("\\n--- Step 5: Cleaning up ---")
    try:
        os.remove(local_model_path)
        print(f"✅ Removed temporary local file: {local_model_path}")
    except OSError as e:
        print(f"❌ Error removing temporary file: {e}")


if __name__ == "__main__":
    main()
`;
 return { code: code.trim(), requirements: requirements.trim() };
};

export const generateHfScript = (repoId: string, filename: string, downloadDir: string, destination: DownloadDestination, gdriveFolderName: string) => {
    if (destination === DownloadDestination.GoogleDrive) {
        return generateGoogleDriveHfScript(repoId, filename, downloadDir, gdriveFolderName);
    }
    return generateLocalHfScript(repoId, filename, downloadDir);
};


const generateLocalCustomUrlScript = (url: string, downloadDir: string) => {
    const requirements = `requests
tqdm`;
    const code = `
import requests
import os
from tqdm import tqdm

# --- Configuration ---
# Direct URL to the GGUF model file
URL = "${url}"
# Local directory to save the model
DOWNLOAD_DIR = "${downloadDir}"

# --- Main download logic ---
def download_model_from_url():
    """
    Downloads a file from a direct URL with a progress bar.
    """
    print("--- GGUF Model Downloader (Custom URL) ---")
    print(f"URL:         {URL}")
    print(f"Destination: {DOWNLOAD_DIR}")
    print("------------------------------------------")

    try:
        # Extract filename from URL, with a fallback
        filename = URL.split('/')[-1].split('?')[0] or "model.gguf"
    except IndexError:
        filename = "model.gguf"

    file_path = os.path.join(DOWNLOAD_DIR, filename)

    # Create the directory if it doesn't exist
    if not os.path.exists(DOWNLOAD_DIR):
        try:
            os.makedirs(DOWNLOAD_DIR)
            print(f"Created directory: {DOWNLOAD_DIR}")
        except OSError as e:
            print(f"❌ Error creating directory {DOWNLOAD_DIR}: {e}")
            return

    print(f"\\nStarting download of {filename}...")
    try:
        # Make the request with streaming to handle large files
        response = requests.get(URL, stream=True, allow_redirects=True)
        response.raise_for_status()  # Raise an exception for bad status codes

        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 KB chunk size

        with tqdm(total=total_size, unit='iB', unit_scale=True, desc=f"📥 {filename}") as progress_bar:
            with open(file_path, 'wb') as f:
                for data in response.iter_content(block_size):
                    progress_bar.update(len(data))
                    f.write(data)
        
        # Final check for download integrity
        if total_size != 0 and progress_bar.n != total_size:
            print("\\n❌ ERROR: Download was incomplete. Please try again.")
        else:
            print(f"\\n✅ Model downloaded successfully!")
            print(f"   -> Path: {file_path}")

    except requests.exceptions.RequestException as e:
        print(f"\\n❌ An error occurred during download: {e}")
        print("   Please check the URL and your network connection.")

if __name__ == "__main__":
    download_model_from_url()
`;
 return { code: code.trim(), requirements: requirements.trim() };
};

// For brevity, the Google Drive version for Custom URL is omitted, but would follow the same pattern
// as the Hugging Face version: download locally first, then upload.
export const generateCustomUrlScript = (url: string, downloadDir: string, destination: DownloadDestination, gdriveFolderName: string) => {
    // A production implementation would also have a Google Drive version here.
    // For this example, we'll just return the local version for both.
    if (destination === DownloadDestination.GoogleDrive) {
        console.warn("Google Drive for Custom URL not fully implemented in this example, generating local script with GDrive instructions.");
        // In a real scenario, this would call a function similar to `generateGoogleDriveHfScript`
        const hfEquivalentScript = generateGoogleDriveHfScript("user/repo", url.split('/').pop() || "model.gguf", downloadDir, gdriveFolderName);
        
        let customUrlGdriveCode = hfEquivalentScript.code;
        // Replace the Hugging Face download function with a custom URL download function
        const customDownloadFunc = `
def download_model_locally():
    """Downloads the model from a custom URL to a local directory."""
    print("--- Step 1: Downloading model from Custom URL ---")
    URL = "${url}"
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)
        
    filename = URL.split('/')[-1].split('?')[0] or "model.gguf"
    local_path = os.path.join(DOWNLOAD_DIR, filename)

    try:
        response = requests.get(URL, stream=True, allow_redirects=True)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        with tqdm(total=total_size, unit='iB', unit_scale=True, unit_divisor=1024, desc=f"📥 {filename}") as pbar:
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    pbar.update(len(chunk))
        print(f"\\n✅ Model downloaded successfully to temporary path: {local_path}")
        return local_path
    except Exception as e:
        print(f"\\n❌ An error occurred during download: {e}")
        return None
`;
        customUrlGdriveCode = customUrlGdriveCode.replace(/def download_model_locally\\(\\):(.|\\n)*?return None/, customDownloadFunc);
        customUrlGdriveCode = customUrlGdriveCode.replace(/# Hugging Face import(.|\\n)*?from huggingface_hub import hf_hub_download/, 'import requests');
        customUrlGdriveCode = customUrlGdriveCode.replace(/^REPO_ID =.*$/m, '# URL defined in download_model_locally()');
        customUrlGdriveCode = customUrlGdriveCode.replace(/^FILENAME =.*$/m, '# Filename is derived from URL');
        
        return { code: customUrlGdriveCode, requirements: hfEquivalentScript.requirements.replace('huggingface-hub', 'requests') };
    }
    return generateLocalCustomUrlScript(url, downloadDir);
};
