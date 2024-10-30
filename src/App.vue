<template>
  <div class="main_block">
    <div class="main_div">
      <div class="left_block">
        <img src="../src/assets/vpn_logo.png" alt="logo">
      </div>
      <div class="right_block">
        <div class="description">
          <p>Бесплатный VPN для предпринимателей</p>
        </div>
        <div class="utps">
          <div class="utp">
            <img src="../src/assets/Star.png" alt="star">
            <p>Высокая скорость</p>
          </div>
          <div class="utp">
            <img src="../src/assets/Star.png" alt="star">
            <p>Безлимитный трафик</p>
          </div>
          <div class="utp">
            <img src="../src/assets/Star.png" alt="star">
            <p>Конфиденциальность</p>
          </div>
        </div>
        <div class="form">
          <p>Заполните форму и доступ с инструкцией придет Вам на почту</p>
          <form @submit.prevent="sendData">
            <input type="text" name="name" id="name" placeholder="Имя" v-model="form.name" required/>
            <input type="email" name="email" id="email" placeholder="email" v-model="form.email" required/>
            <div class="check_box">
              <input type="text" name="site" id="site" placeholder="Сайт вашего бизнеса" v-model="form.site" :disabled="isCheck" />
              <input type="checkbox" name="check" id="check" v-model="isCheck" />
              <p>У меня нет сайта</p>
            </div>
            <div class="check_box2">
              <input type="checkbox" name="check2" id="check2" v-model="isCheckBtn" required/>
              <p>Отправляя данную форму Вы соглашаетесь с политикой конфиденциальности и получением коммерческих предложений</p>
            </div>
            <div class="message">{{ message }}</div>
            <button type="submit" :disabled="!isCheckBtn">Отправить</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      isCheck: false,
      isCheckBtn: false,
      form: {
        name: '',
        email: '',
        site: ''
      },
      message: ''
    }
  },
  methods: {
    async sendData() {
      try {
        const response = await axios.post('api/sendData', this.form)
        if (response.status === 200) {
          this.message = 'Данные отправлены. Инструкция по подключению придет на указанную почту'
          this.form = {
            name: '',
            email: '',
            site: ''
          }
          setTimeout(() => {
            this.message = ''
          }, 2000)
        }
      } catch(error) {
        console.log(error)
      }
    }
  },
  mounted() {

  }
}
</script>

<style scoped>
.main_block {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #eaeaea;
}
.main_div {
  width: 1200px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 32px;
}
.left_block {
  width: 100%;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}
.left_block img {
  width: 100%;
  object-fit: contain;
}
.right_block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}
.description {
  width: 100%;
  box-sizing: border-box;
  padding: 24px;
}
.description p {
  font-size: 48px;
  font-weight: 900;
  color: #2c3e50;
  line-height: 100%;
  margin-bottom: 0;
}
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  padding: 24px;
  background: #2c3e50;
  border-radius: 24px;
}
.form p {
  font-size: 32px;
  text-align: center;
  line-height: 100%;
  color: #fff;
  font-weight: 600;
}
.form form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
}
input {
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  border: #eaeaea solid 1px;
  color: #eaeaea;
}
input:focus {
  outline: none;
}
input::placeholder {
  color: #fff;
}
.check_box {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: center;
}
.check_box input {
  width: 100%;
}
.check_box input[type='checkbox'] {
  width: fit-content;
}
.check_box p {
  font-size: 12px;
  text-align: start;
  margin-bottom: 0;
  font-weight: 600;
  white-space: nowrap;
}
.check_box2 {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}
.check_box2 p {
  font-size: 12px;
  text-align: start;
  margin-bottom: 0;
  font-weight: 300;
}
form button {
  box-sizing: border-box;
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: blanchedalmond;
  align-self: center;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0);
  transform: translateY(0);
  transition: all 300ms ease-in-out;
  color: #2c3e50;
  font-weight: 500;
  cursor: pointer;
}
form button:disabled {
  box-shadow: none;
  background: burlywood;
}
form button:disabled:hover {
  box-shadow: none;
  background: burlywood;
  transform: translateY(0);
}
form button:hover {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
}
.utps {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.utp {
  width: fit-content;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.utp p {
  font-weight: 600;
}
.message {
  font-size: 16px;
  color: green;
  font-weight: 700;
  align-self: center;
  text-align: center;
}
@media all and (max-width: 800px) {
  .main_block {
  width: 100%;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #eaeaea;
  box-sizing: border-box;
  padding: 12px 10px;
}
.main_div {
  width: 1200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}
.left_block {
  width: auto;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}
.left_block img {
  width: auto;
  height: 40vh;
  object-fit: contain;
}
.right_block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}
.description {
  width: 100%;
  box-sizing: border-box;
  padding: 24px;
}
.description p {
  font-size: 30px;
  font-weight: 900;
  color: #2c3e50;
  line-height: 100%;
  margin-bottom: 0;
}
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  padding: 24px;
  background: #2c3e50;
  border-radius: 24px;
}
.form p {
  font-size: 20px;
  text-align: center;
  line-height: 100%;
  color: #fff;
  font-weight: 600;
}
.form form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
}
input {
  box-sizing: border-box;
  padding: 6px 8px;
  border-radius: 6px;
  background: transparent;
  border: #eaeaea solid 1px;
  color: #eaeaea;
}
input:focus {
  outline: none;
}
input::placeholder {
  color: #fff;
  font-size: 12px;
}
.check_box {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: center;
}
.check_box input {
  width: 100%;
}
.check_box input[type='checkbox'] {
  width: fit-content;
}
.check_box p {
  font-size: 12px;
  text-align: start;
  margin-bottom: 0;
  font-weight: 600;
  white-space: nowrap;
}
.check_box2 {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}
.check_box2 p {
  font-size: 12px;
  text-align: start;
  margin-bottom: 0;
  font-weight: 300;
}
form button {
  box-sizing: border-box;
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: blanchedalmond;
  align-self: center;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0);
  transform: translateY(0);
  transition: all 300ms ease-in-out;
  color: #2c3e50;
  font-weight: 500;
  cursor: pointer;
}
form button:disabled {
  box-shadow: none;
  background: burlywood;
}
form button:disabled:hover {
  box-shadow: none;
  background: burlywood;
  transform: translateY(0);
}
form button:hover {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
}
.utps {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 8px;
}
.utp {
  width: fit-content;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.utp p {
  font-weight: 600;
  font-size: 10px;
}
.message {
  font-size: 12px;
}
}
</style>