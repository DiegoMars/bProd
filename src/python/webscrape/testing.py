# Remember to start the enviroment with the follwing:
# source .venv/bin/activate
# .\venv\Scripts\Activate.ps1

# import requests as req
# from bs4 import BeautifulSoup as BS
from selenium import webdriver

### Thing 1
# res = req.get('https://www.geeksforgeeks.org/python/python-programming-language-tutorial/')
# soup = BS(res.content, 'html.parser')
# content = soup.find('div', class_='article--viewer_content')
# if content:
#     for para in content.find_all('p'):
#         print(para.text.strip())
# else:
#     print("No article content found.")

### Thing 2
# res  = req.get('https://lightroom.adobe.com/shares/b829975c1a7445559f6c6291b9e6487c')
# soup = BS(res.content, 'html.parser')
# try:
#     with open('output.html', 'w') as file:
#         file.write(soup.prettify())
#     print("Content successfully written to output.html")
# except IOError as e:
#     print(f"An error occurred: {e}")

### Thing 3
# driver = webdriver.Firefox() # Idk what this error means but it works nonetheless lmao
# driver.get('https://www.geeksforgeeks.org/python/python-programming-language-tutorial/')
