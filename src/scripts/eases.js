// Shared GSAP eases. "punch" is the hover ease; CSS uses the identical curve as --ease-punch (tokens.css).
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
CustomEase.create('punch', 'M0,0 C0.19,1 0.22,1 1,1');
