import socket
import sys
import time
import urllib.request
from urllib.error import URLError, HTTPError

def check_port(host, port, service_name):
    """Tester om en port er åben via TCP socket"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2) # 2 sekunders timeout
        result = sock.connect_ex((host, port))
        sock.close()

        if result == 0:
            print(f"✅ [OK] {service_name} kører på {host}:{port}")
            return True
        else:
            print(f"❌ [FEJL] {service_name} svarer IKKE på port {port}. (Port lukket)")
            return False
    except Exception as e:
        print(f"❌ [FEJL] Kunne ikke teste {service_name}: {e}")
        return False

def check_http(url, service_name):
    """Tester om en URL returnerer 200 OK"""
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            code = response.getcode()
            if code == 200:
                print(f"✅ [HTTP OK] {service_name} svarer HTTP 200 på {url}")
            else:
                print(f"⚠️ [HTTP ADVARSEL] {service_name} svarede med kode {code}")
    except HTTPError as e:
        print(f"⚠️ [HTTP] {service_name} svarede: {e.code} (Dette kan være OK hvis det er 404/401)")
    except URLError:
        print(f"❌ [HTTP FEJL] Kunne ikke forbinde til {url} (Er serveren helt oppe?)")

def main():
    print("🩺 --- WidgeTDC Health Check --- 🩺")
    print("Tester om dine servere kører korrekt...\n")

    # 1. Check Frontend (Vite kører ofte på 5173)
    frontend_up = check_port("localhost", 5173, "Frontend (Vite)")

    # 2. Check Backend (Express/Nest kører ofte på 3000 eller 3001)
    # Vi tester begge for sikkerheds skyld, da konfigurationen kan variere
    backend_up_3000 = check_port("localhost", 3000, "Backend (Port 3000)")
    backend_up_3001 = check_port("localhost", 3001, "Backend (Port 3001)")

    backend_active = backend_up_3000 or backend_up_3001
    backend_port = 3000 if backend_up_3000 else 3001

    print("\n--- Analyserer Status ---")

    if frontend_up and backend_active:
        print("🚀 Alt ser grønt ud på netværket!")
        print("   Hvis appen stadig fejler, er det en intern software-fejl (f.eks. Database/API key).")
        # Prøv et HTTP kald hvis portene er åbne
        print("\nForsøger HTTP handshake...")
        check_http("http://localhost:5173", "Frontend")
        check_http(f"http://localhost:{backend_port}/health", "Backend API Health") # Gæt på endpoint

    elif not backend_active:
        print("🔥 KRITISK: Backenden kører ikke.")
        print("   Løsning: Tjek outputtet i det vindue hvor du kørte 'start_fixed.py'.")
        print("   Leder efter fejl som 'Error: SQLITE_CANTOPEN' eller 'Address already in use'.")

    elif not frontend_up:
        print("⚠️ Frontend kører ikke. Siden kan ikke vises.")

if __name__ == "__main__":
    main()
