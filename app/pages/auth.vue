<script setup>
const { login, register } = useStrapiAuth()
const router = useRouter()
import API from "~/composables/api";
const api = new API()
const isRegistered = ref(false)
import useNotifi from "~/composables/useNotifi";
const toast = useNotifi()
const isTokenVisible = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  room: '',
  pin: '',
  confirmationToken: null
})

const userDataRes = ref(null)
const patch = useCookie('patch')
const onRegister = async () => {
  console.log('click register', form.value);
  try {
    api.registerUser(form.value).then(res => {
      isTokenVisible.value = true
      userDataRes.value = res.user
    })

  } catch (e) {
  }
}




const error = ref(null)


const onLogin = async () => {
  console.log('click login');


  try {
    error.value = null
    const user = await login({
      identifier: form.value.email,
      password: form.value.password
    })
    if (user?.user?.value) {
      if (user.user?.value?.Type === 'Admin') {
        console.log('patch.value -> ', patch.value);
        router.push(patch.value || '/')
      } else {
        console.log('patch.value -> ', patch.value);
        router.push(patch.value || '/')
        console.log("else")
      }
    }
    console.log("user 1 -> ", user.user.value)
    console.log("user -> ", user.user.value.username)

    // router.push('/authenticated-page')
  } catch (e) {
    console.log('error', e);
    if (e.error.message === 'Invalid identifier or password') {
      error.value = 'Неверный логин или пароль'
    } else if (e.error.message === 'Your account has been blocked by an administrator') {
      error.value = 'Ваш аккаунт заблокирован!'
    }
  }
}

watchDeep(form, async () => {
  if (form.value.confirmationToken?.length === 6) {
    const res = await api.sendToken(form.value.confirmationToken, userDataRes.value)
    if (res.status === 200) {
      console.log('ok status');
      onLogin()

    } else {
      toast.showError("Неверный код!");
    }
  }
})

function onClick() {
  if (!isRegistered.value) {
    onLogin()
  } else {
    onRegister()
  }
}




</script>

<template>
  <div class="w-screen h-screen flex justify-center items-center bg_black text-sm">
    <div class="w-[300px] h-auto bg_gray p-5 rounded-xl flex flex-col gap-5 overflow-hidden">
      <span class="text-center w-full text-2xl font-bold">TIME MEET</span>
      <div v-if="!isTokenVisible" class="flex flex-col gap-5">
        <Transition name="fade" mode="out-in">
          <div v-if="isRegistered" class="formInput">
            <span>Имя</span>
            <InputText v-model="form.username" name="username" type="text" placeholder="" class="" />
          </div>
        </Transition>

        <div class="formInput">
          <span>Email</span>
          <InputText v-model="form.email" name="username" type="text" placeholder="" class="" />
        </div>
        <div class="formInput">
          <span>Пароль</span>
          <Password v-model="form.password" name="password" placeholder="" type="password" :feedback="false"
            toggleMask />
        </div>
        <Transition name="fade" mode="out-in">
          <div v-if="isRegistered" class="formInput">
            <span>Повторите пароль</span>
            <Password v-model="form.confirmPassword" name="password" placeholder="" type="password" :feedback="false"
              toggleMask />
          </div>
        </Transition>
        <Button @click="onClick" :label="!isRegistered ? 'Войти' : 'Зарегистрироваться'" />
        <div v-if="error" class="flex justify-center w-full py-1">
          <span class="text-red-500">{{ error }}</span>
        </div>

        <div class="flex justify-center ">
          <button @click="isRegistered = !isRegistered">{{ isRegistered ? 'Есть аккаунт' : 'Нет аккаунта?' }} </button>
        </div>
      </div>
      <div v-else class="flex flex-col gap-4 justify-center items-center py-4">
        <InputOtp v-model="form.confirmationToken" :length="6" integerOnly />
        <span class="w-full text-center ">Введите код из письма отправленный на почту {{ form.email }}</span>
      </div>
    </div>
  </div>


</template>

<style scoped>
@reference "tailwindcss";
@reference "@/assets/css/global.css";

.formInput {
  @apply flex flex-col gap-2;
}
</style>