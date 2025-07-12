let socket;
let currentRoomId = null;
let username = '';
let major = '';
let supaemail = '';

const usernameInput = document.getElementById('username');
const majorSelect = document.getElementById('major');
const form = document.getElementById('infoForm');
const status = document.getElementById('status');
const chatDiv = document.getElementById('chat');
const messages = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const leaveBtn = document.getElementById('leave');

function majorToKorean(code) {
  switch (code) {
    case 'EB': return 'E-비즈니스';
    case 'DC': return '디지털콘텐츠';
    case 'WP': return '웹프로그래밍';
    case 'HD': return '해킹 방어과';
    default: return '알 수 없음';
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  username = usernameInput.value.trim();
  major = majorSelect.value;

  if (!username) {
    alert('닉네임을 입력해주세요');
    return;
  }

  form.style.display = 'none';
  usernameInput.style.display = 'none';

  socket.emit('register', { username, major, email: supaemail});
  status.innerText = '다른 사용자 대기 중입니다...';
});

function startSocket() {
    socket = io();
  
    socket.on('matched', ({ roomId, partner }) => {
      currentRoomId = roomId;
      status.innerText = `채팅 상대: ${partner.username} (${majorToKorean(partner.major)})`;
      chatDiv.style.display = 'block';
    });
  
    socket.on('message', ({ username, message }) => {
      const msg = document.createElement('div');
      msg.innerText = `${username}: ${message}`;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    });
  
    socket.on('partner_left', () => {
      const msg = document.createElement('div');
      msg.innerText = '상대방이 채팅을 떠났습니다.';
      msg.style.color = '#ff69b4';
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    });
  }
  
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const msgText = input.value;
  if (msgText && currentRoomId) {
    socket.emit('message', { roomId: currentRoomId, message: msgText, username });
    const msg = document.createElement('div');
    msg.innerText = `${username}(나): ${msgText}`;
    messages.appendChild(msg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  }
}

leaveBtn.addEventListener('click', () => {
    socket.disconnect();
    chatDiv.style.display = 'none';
    form.style.display = 'block';
    usernameInput.style.display = 'block';
    status.innerText = '닉네임과 과를 입력하고 다시 시작하세요';
});


// --------------------------------------------------------------------------------------------------------------------


// 로그인
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    supaemail = session.user.email;
    startSocket();
    // console.log('자동 로그인 상태:', session);
    document.getElementById('authSection').style.display = 'none';  // 👉 숨기기
    document.getElementById('infoForm').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    status.innerText = '닉네임과 과를 입력하고 시작하세요';
    } else {
    console.log('로그인 필요')
    status.innerText = '로그인 후 채팅을 시작할 수 있습니다.';
  }
});

async function signUp() {
  const email = document.getElementById('signUpEmail').value
  const password = document.getElementById('signUpPassword').value
  const passwordCheck = document.getElementById('signUpPasswordCheck').value
  const teacherName = document.getElementById('teacherName').value.trim()
  if (password !== passwordCheck) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }
  if (teacherName !== '이민주') {
    alert('제제쌤의 본명을 정확히 입력해주세요.');
    return;
  }
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    // console.error('회원가입 실패:', error.message)
    alert('회원가입 실패\n다시 시도해 주세요')
  } else {
    // console.log('회원가입 성공:', data)
    alert('회원가입 성공!')
    showLogin()
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  const { data: { session } } = await supabase.auth.getSession()
  if (error) {
    // console.error('로그인 실패:', error.message)
    alert("로그인 실패")
  } else {
    supaemail = session.user.email;
    startSocket();
    // console.log('로그인 성공:', data)
    // alert('로그인 성공!')
    document.getElementById('authSection').style.display = 'none';  // 👉 숨기기
    document.getElementById('infoForm').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    status.innerText = '닉네임과 과를 입력하고 시작하세요';
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // console.error('로그아웃 실패:', error.message)
      alert('로그아웃 실패: ',error.message)
    } else {
      alert('로그아웃 되었습니다.');
      location.reload();
    }
  });

function showSignUp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('signUpSection').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('signUpSection').style.display = 'none';
}
